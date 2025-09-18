import os
import psycopg2
from dotenv import load_dotenv

# Configurações
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def salvar_noticias_no_postgres(noticias):
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()

    for noticia in noticias:
        try:
            cur.execute("""
                INSERT INTO news (
                    id, title, summary, content, "imageUrl", source, "sourceUrl",
                    "publishedAt", "createdAt", "updatedAt", category, tags, tickers
                ) VALUES (
                    gen_random_uuid(), %s, %s, %s, %s, %s, %s,
                    %s, NOW(), NOW(), %s, %s, %s
                )
                ON CONFLICT ("sourceUrl") DO NOTHING;
            """, (
                noticia["title"],
                noticia["summary"],
                noticia["content"],
                noticia["imageUrl"],
                noticia["source"],
                noticia["sourceUrl"],
                noticia["publishedAt"],
                noticia["category"],
                noticia["tags"],
                noticia["tickers"]
            ))
            print(f"✅ Inserida: {noticia['title']}")
        except Exception as e:
            print(f"❌ Falha ao inserir: {noticia['title']} → {e}")

    conn.commit()
    cur.close()
    conn.close()