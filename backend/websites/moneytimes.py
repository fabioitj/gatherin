from bs4 import BeautifulSoup
from datetime import datetime
import requests
from lib.openai import gerar_resumo_com_ia, validar_conteudo_com_ia, capturar_tipo_por_conteudo
from lib.https import HEADERS
from abstract.website import Website

class MoneyTimes(Website):
    BASE_URL = "https://www.moneytimes.com.br/ultimas-noticias/"

    def __init__(self):
        super().__init__("MoneyTimes")

    def extract(self):
        noticias = []
        res = requests.get(self.BASE_URL, headers=HEADERS)
        soup = BeautifulSoup(res.text, 'html.parser')
        artigos = soup.select(".news-list .news-item")

        for artigo in artigos:
            try:
                link = artigo.select_one("h2 a")["href"]
                if not link.startswith("http"):
                    link = self.BASE_URL + link

                res_content = requests.get(link, headers=HEADERS)
                soup_content = BeautifulSoup(res_content.text, 'html.parser')
                article_component = soup_content.select_one("article.single")

                titulo = article_component.select_one('h1').text.strip()
                corpo = article_component.select_one('.single_block_news_text').text.strip()
                data_str = article_component.select_one(".single_meta_author_infos_date_time").text.strip()
                data_pub = datetime.strptime(data_str, "%d %b %Y, %H:%M")
                imagem_url = article_component.select_one('.single_block_news_image img')["src"]

                conteudo_limpo = validar_conteudo_com_ia(titulo, corpo)
                resumo = gerar_resumo_com_ia(conteudo_limpo)
                tipo_categoria = capturar_tipo_por_conteudo(conteudo_limpo)

                noticias.append({
                    "title": titulo,
                    "summary": resumo,
                    "content": conteudo_limpo,
                    "imageUrl": imagem_url,
                    "source": self.nome_fonte,
                    "sourceUrl": link,
                    "publishedAt": data_pub.isoformat(),
                    "category": tipo_categoria.upper().replace(' ', ''),
                    "tags": [],
                    "tickers": []
                })

                print("Adicionado o", titulo)
            except Exception as e:
                print(f"[ERRO] {e}")

        return noticias
