\# Talk2Db



> Chat with your database using natural language — powered by OpenAI.



Talk2Db lets you query SQLite databases through a simple conversational interface. Instead of writing SQL, just type what you want in plain English and get instant results.



\---



\## Features



\- Natural language queries — No SQL knowledge required

\- OpenAI-powered — Uses GPT to understand and translate your questions

\- SQLite support — Works with local `.db` files out of the box

\- Simple web UI — Clean HTML interface to interact with your data

\- Docker-ready — Easily containerized for deployment



\---



\## Tech Stack



| Layer | Technology |

|-------|------------|

| Backend | Python |

| Database | SQLite |

| AI | OpenAI API (GPT) |

| Frontend | HTML |

| Container | Docker |



\---



\## Getting Started



\### Prerequisites



\- Python 3.8+

\- An OpenAI API key → \[Get one here](https://platform.openai.com/api-keys)



\### Installation



1\. \*\*Clone the repository\*\*

&#x20;  ```bash

&#x20;  git clone https://github.com/Pragna-824/Talk2Db.git

&#x20;  cd Talk2Db

&#x20;  ```



2\. \*\*Install dependencies\*\*

&#x20;  ```bash

&#x20;  pip install -r requirements.txt

&#x20;  ```



3\. \*\*Set up environment variables\*\*



&#x20;  Create a `.env` file in the root of the project:

&#x20;  ```

&#x20;  OPENAI\_API\_KEY=your\_api\_key\_here

&#x20;  ```



4\. \*\*Run the app\*\*

&#x20;  ```bash

&#x20;  python db\_app.py

&#x20;  ```



5\. Open your browser and navigate to `http://localhost:5000`



\---



\## Usage



Once the app is running, you can ask questions like:



\- "Show me all students with a GPA above 3.5"

\- "List all faculty members in the Computer Science department"

\- "How many students are enrolled this semester?"



Talk2Db will convert your question into SQL, run it against the database, and return the results in a readable format.



\---



\## Project Structure



```

Talk2Db/

├── static/               # Static assets (CSS, JS)

├── templates/            # HTML templates

├── db\_app.py             # Main application entry point

├── interact\_with\_db1.py  # Database interaction logic

├── Faculty.db            # Sample faculty database

├── student.db            # Sample student database

├── requirements.txt      # Python dependencies

├── Dockerfile            # Docker configuration

├── .env.example          # Environment variable template

└── .gitignore            # Files excluded from Git

```



\---



\## Running with Docker



```bash

docker build -t talk2db .

docker run -p 5000:5000 talk2db

```



\---



\## Environment Variables



This project uses a `.env` file to store sensitive credentials. This file is \*\*never committed to GitHub\*\*.



\### Setup



1\. Create a `.env` file in the root of the project:

&#x20;  ```

&#x20;  OPENAI\_API\_KEY=your\_api\_key\_here

&#x20;  ```



2\. Create a `.gitignore` file and add this line:

&#x20;  ```

&#x20;  .env

&#x20;  ```

&#x20;  This prevents your API key from being accidentally uploaded to GitHub.



3\. A `.env.example` file is provided as a template — copy it and fill in your real values.



| Variable | Description |

|----------|-------------|

| `OPENAI\_API\_KEY` | Your OpenAI API key (required) |



> Warning: Never share your API key publicly. If you accidentally pushed it to GitHub,

> regenerate it immediately at https://platform.openai.com/api-keys



\---



\## License



This project is licensed under the MIT License — see the \[LICENSE](LICENSE) file for details.



\---



\## Author



\*\*Pragna-824\*\* — \[GitHub Profile](https://github.com/Pragna-824)



\---



> If you found this project useful, consider giving it a star!

