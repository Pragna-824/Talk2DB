# Talk2Db

> Chat with your database using natural language — powered by OpenAI.

Talk2Db lets you query SQLite databases through a simple conversational interface. Instead of writing SQL, just type what you want in plain English and get instant results.

---

## Features

-  **Natural language queries** — No SQL knowledge required
-  **OpenAI-powered** — Uses GPT to understand and translate your questions
-  **SQLite support** — Works with local `.db` files out of the box
-  **Simple web UI** — Clean HTML interface to interact with your data
-  **Docker-ready** — Easily containerized for deployment

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Python |
| Database | SQLite |
| AI | OpenAI API (GPT) |
| Frontend | HTML |
| Container | Docker |

---

##  Getting Started

### Prerequisites

- Python 3.8+
- An OpenAI API key → [Get one here](https://platform.openai.com/api-keys)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Pragna-824/Talk2Db.git
   cd Talk2Db
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**

   Open the `.env` file and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. **Run the app**
   ```bash
   python db_app.py
   ```

5. Open your browser and navigate to `http://localhost:5000`

---

##  Usage

Once the app is running, you can ask questions like:

- *"Show me all students with a GPA above 3.5"*
- *"List all faculty members in the Computer Science department"*
- *"How many students are enrolled this semester?"*

Talk2Db will convert your question into SQL, run it against the database, and return the results in a readable format.

---

##  Project Structure

```
Talk2Db/
├── static/               # Static assets (CSS, JS)
├── templates/            # HTML templates
├── db_app.py             # Main application entry point
├── interact_with_db1.py  # Database interaction logic
├── Faculty.db            # Sample faculty database
├── student.db            # Sample student database
├── requirements.txt      # Python dependencies
├── Dockerfile            # Docker configuration
└── .env                  # Environment variables (not committed)
```

---

##  Running with Docker

```bash
docker build -t talk2db .
docker run -p 5000:5000 talk2db
```

---

##  Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | Your OpenAI API key (required) |

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Author

**Pragna-824** — [GitHub Profile](https://github.com/Pragna-824)

---

>  If you found this project useful, consider giving it a star!