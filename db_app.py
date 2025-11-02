from dotenv import load_dotenv
load_dotenv()

import os
import sqlite3
import uuid
from flask import Flask, render_template, request, jsonify, abort, session

# LangChain / OpenAI
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.messages import BaseMessage

# ---------------- Flask app ----------------
app = Flask(__name__)
app.secret_key = os.getenv("FLASK_SECRET_KEY", "dev-secret-change-me")

# Map logical ids to real files
DB_MAP = {
    "student.db": "student.db",
    "Faculty.db": "Faculty.db",
}

# -------- In-memory chat histories (per session) --------
_CHAT_STORES = {}  # session_id -> ChatMessageHistory()


def _get_session_id() -> str:
    sid = session.get("sid")
    if not sid:
        sid = str(uuid.uuid4())
        session["sid"] = sid
    return sid


def _history_factory(session_id: str) -> ChatMessageHistory:
    if session_id not in _CHAT_STORES:
        _CHAT_STORES[session_id] = ChatMessageHistory()
    return _CHAT_STORES[session_id]


def _current_role() -> str:
    return session.get("role", "viewer")


# ------------- LLM setup -------------------
llm = ChatOpenAI(
    temperature=0.3,
    api_key=os.getenv("OPENAI_API_KEY"),
    model=os.getenv("OPENAI_MODEL", "gpt-3.5-turbo"),
)
parser = StrOutputParser()

SYSTEM_TMPL = """You are an expert assistant that converts English questions into SQLITE3 queries
for the provided database schema.

STRICT RULES:
- OUTPUT ONLY the SQLITE3 command (no backticks, no prose, no comments).
- Use CAPITAL LETTERS for SQL keywords.
- Use valid SQLITE3 syntax (NOT MySQL or Postgres).
- Prefer fully qualified table names when helpful.
- Obey prior chat context/follow-ups (chat history is provided).
"""

prompt = ChatPromptTemplate.from_messages(
    [
        ("system", SYSTEM_TMPL),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "SCHEMA:\n{content}\n\nQUESTION:\n{input_query}"),
    ]
)

base_chain = prompt | llm | parser

# IMPORTANT: get_session_history must accept a session_id: str
memory_chain = RunnableWithMessageHistory(
    base_chain,
    lambda session_id: _history_factory(session_id),
    input_messages_key="input_query",
    history_messages_key="chat_history",
)

# ---------- Helpers ----------
def get_table_info(database_path: str) -> str:
    conn = sqlite3.connect(database_path)
    cursor = conn.cursor()

    schema_info = ""
    cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    tables = cursor.fetchall()

    for (table_name,) in tables:
        schema_info += f"Structure of table '{table_name}':\n"
        cursor.execute(f"PRAGMA table_info('{table_name}')")
        for col in cursor.fetchall():
            schema_info += (
                f"Column: {col[1]}, Type: {col[2]}, "
                f"Not Null: {col[3]}, Default Value: {col[4]}, "
                f"Primary Key: {col[5]}\n"
            )
        schema_info += "-" * 40 + "\n"

    cursor.close()
    conn.close()
    return schema_info


def execute_select(db_path: str, sql: str):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall()
    cols = [d[0] for d in cur.description] if cur.description else []
    conn.close()
    dict_rows = [dict(zip(cols, r)) for r in rows]
    return cols, dict_rows


def execute_any(db_path: str, sql: str):
    """Admin executor: runs any single SQL; returns rows/cols if present."""
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(sql)
    rows = cur.fetchall() if cur.description else []
    cols = [d[0] for d in cur.description] if cur.description else []
    conn.commit()
    conn.close()
    dict_rows = [dict(zip(cols, r)) for r in rows]
    return cols, dict_rows


def is_select_only(sql: str) -> bool:
    s = sql.strip().rstrip(";").strip().upper()
    forbidden = ("INSERT","UPDATE","DELETE","DROP","ALTER","TRUNCATE","ATTACH","DETACH","PRAGMA")
    if any(k in s for k in forbidden):
        return False
    return s.startswith("SELECT")


def build_sql_from_nl(question: str, schema_text: str, session_id: str) -> str:
    return memory_chain.invoke(
        {"input_query": question, "content": schema_text},
        config={"configurable": {"session_id": session_id}},
    ).strip()


# ---------------- Routes -------------------
@app.route("/")
def home():
    _get_session_id()
    return render_template("index.html")


@app.route("/api/databases", methods=["GET"])
def api_databases():
    items = []
    for db_file in DB_MAP.values():
        display = os.path.splitext(os.path.basename(db_file))[0].upper() + "_DB"
        items.append({"id": db_file, "name": display})
    return jsonify(items)


@app.route("/api/tables", methods=["GET"])
def api_tables():
    db_id = request.args.get("database")
    if not db_id or db_id not in DB_MAP:
        return abort(400, "Invalid or missing 'database'")
    db_path = DB_MAP[db_id]
    if not os.path.exists(db_path):
        return abort(404, f"Database file not found: {db_path}")

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    )
    tables = [r[0] for r in cur.fetchall()]
    conn.close()
    return jsonify(tables)


@app.route("/api/query", methods=["POST"])
def api_query():
    data = request.get_json(silent=True) or {}
    database = data.get("database")
    table = data.get("table")  # kept for UI parity
    question = data.get("query", "").strip()

    if not database or database not in DB_MAP:
        return abort(400, "Invalid or missing 'database'")
    if not question:
        return abort(400, "Missing 'query'")

    db_path = DB_MAP[database]
    if not os.path.exists(db_path):
        return abort(404, f"Database file not found: {db_path}")

    schema_text = get_table_info(db_path)
    session_id = _get_session_id()
    sql = build_sql_from_nl(question, schema_text, session_id)

    role = _current_role()
    is_admin = role == "admin"
    if not is_admin and not is_select_only(sql):
        return abort(403, "Mutating SQL requires Admin role.")

    try:
        if is_admin:
            columns, rows = execute_any(db_path, sql)
        else:
            columns, rows = execute_select(db_path, sql)
        return jsonify({"sql": sql, "columns": columns, "rows": rows})
    except Exception as e:
        return abort(400, f"SQLite error: {e}")


# ---- Memory utils ----
@app.route("/api/memory/clear", methods=["POST"])
def api_memory_clear():
    sid = _get_session_id()
    if sid in _CHAT_STORES:
        _CHAT_STORES.pop(sid, None)
    return jsonify({"ok": True})


# ---- History pages/APIs ----
@app.route("/history")
def history_page():
    _get_session_id()
    return render_template("history.html")


@app.route("/api/history", methods=["GET"])
def api_history():
    sid = _get_session_id()
    history = _history_factory(sid).messages if sid in _CHAT_STORES else []
    def to_dict(m: BaseMessage):
        return {"role": getattr(m, "type", "unknown"),
                "content": getattr(m, "content", "")}
    return jsonify([to_dict(m) for m in history])


# ---- Role APIs ----
@app.route("/api/role", methods=["GET"])
def api_role():
    return jsonify({"role": _current_role()})

@app.route("/api/auth/admin", methods=["POST"])
def api_auth_admin():
    data = request.get_json(silent=True) or {}
    passcode = data.get("passcode", "")
    expected = os.getenv("ADMIN_PASSCODE", "admin123")  # set in .env
    if passcode == expected:
        session["role"] = "admin"
        return jsonify({"ok": True, "role": "admin"})
    abort(401, "Invalid passcode")

@app.route("/api/auth/viewer", methods=["POST"])
def api_auth_viewer():
    session["role"] = "viewer"
    return jsonify({"ok": True, "role": "viewer"})


# -------------- Entrypoint ---------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", 5000)), debug=False)
