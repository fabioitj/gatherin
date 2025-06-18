import requests
from bs4 import BeautifulSoup
from datetime import datetime
import psycopg2
import os
from lib.openai import gerar_resumo_com_ia, validar_conteudo_com_ia
from lib.db import salvar_noticias_no_postgres
from lib.https import HEADERS

BASE_URL = "https://www.infomoney.com.br"
LIST_URL = f"{BASE_URL}/cotacoes/b3/"

def start_infomoney():
    noticias_fii = extrair_noticias("FII")
    salvar_noticias_no_postgres(noticias_fii)
    noticias_acoes = extrair_noticias("ACOES")
    salvar_noticias_no_postgres(noticias_acoes)

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