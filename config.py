"""Load only known local settings. Never execute .env contents."""
import os
from pathlib import Path
ALLOWED={'AI_ACCESS_CODE','AI_USAGE_DB','AI_HOURLY_LIMIT','AI_DAILY_LIMIT','AI_TOTAL_LIMIT','AI_PROVIDER','OPENAI_API_KEY','OPENAI_MODEL','GEMINI_API_KEY','GEMINI_MODEL','FALKORDB_HOST','FALKORDB_PORT','FALKORDB_USERNAME','FALKORDB_PASSWORD','FALKORDB_SSL','PORT','COOKIE_SECURE'}
def load():
 path=Path(__file__).parent/'.env'
 if not path.exists():return
 for line in path.read_text().splitlines():
  name,sep,value=line.partition('=')
  if sep and name.strip() in ALLOWED:os.environ.setdefault(name.strip(),value.strip().strip('\"\''))
