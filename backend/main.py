import requests
from bs4 import BeautifulSoup
from datetime import datetime
import psycopg2
import os
from dotenv import load_dotenv
import schedule
import time
from lib.openai import client

load_dotenv()

# Configurações
DATABASE_URL = os.getenv("DATABASE_URL")

BASE_URL = "https://www.infomoney.com.br"
LIST_URL = f"{BASE_URL}/cotacoes/b3/"
HEADERS = {"User-Agent": "Mozilla/5.0"}

def validar_conteudo_com_ia(title: str, content: str) -> str:
    prompt = f"""
Você é um assistente que analisa notícias de investimentos.
Remova trechos genéricos, propagandas e deixe apenas o conteúdo útil relacionado ao título abaixo.

Título: "{title}"

Conteúdo:
\"\"\"{content}\"\"\"
"""
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512
    )
    return response.choices[0].message.content.strip()

def gerar_resumo_com_ia(content: str) -> str:
    prompt = f"""
Resuma o texto abaixo em uma ou duas frases objetivas, mantendo o foco no conteúdo principal:

\"\"\"{content}\"\"\"
"""
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=256
    )
    return response.choices[0].message.content.strip()

def extrair_noticias(tipo_categoria):
    url_suffix = "fii/" if tipo_categoria == "FII" else "acao/"
    res = requests.get(LIST_URL + url_suffix, headers=HEADERS)
    soup = BeautifulSoup(res.text, 'html.parser')
    artigos = soup.select(".article-card")
    noticias = []

    for artigo in artigos:
        try:
            link = artigo.select_one(".article-card__asset a")["href"]
            if not link.startswith("http"):
                link = BASE_URL + link

            res_content = requests.get(link, headers=HEADERS)
            soup_content = BeautifulSoup(res_content.text, 'html.parser')

            titulo = soup_content.select_one('h1').text.strip()
            corpo = soup_content.select_one('.im-article').text.strip()
            data_str = soup_content.select("time")[0].text.strip()
            data_pub = datetime.strptime(data_str, "%d/%m/%Y %Hh%M")
            imagem_url = artigo.select_one('img')["src"]

            conteudo_limpo = validar_conteudo_com_ia(titulo, corpo)
            resumo = gerar_resumo_com_ia(conteudo_limpo)

            noticias.append({
                "title": titulo,
                "summary": resumo,
                "content": conteudo_limpo,
                "imageUrl": imagem_url,
                "source": "InfoMoney",
                "sourceUrl": link,
                "publishedAt": data_pub.isoformat(),
                "category": tipo_categoria,
                "tags": [],
                "tickers": []
            })
            
            print("Adicionado o", titulo)

        except Exception as e:
            print(f"[ERRO] {e}")

    return noticias

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

def tarefa_diaria():
    categoria = "FII"  # ou "ACOES"
    noticias = extrair_noticias(categoria)
    salvar_noticias_no_postgres(noticias)

schedule.every().minute.do(tarefa_diaria)
tarefa_diaria()

print("Agendador iniciado... Ctrl+C para parar.")
while True:
    schedule.run_pending()
    time.sleep(1)
