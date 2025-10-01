from bs4 import BeautifulSoup
from datetime import datetime
import requests
from lib.openai import gerar_resumo_com_ia, validar_conteudo_com_ia, capturar_tipo_por_conteudo
from lib.https import HEADERS
from abstract.website import Website
from lib.ticker_extractor import TickerExtractor
from zoneinfo import ZoneInfo
import re

class Investidor10(Website):
    BASE_URL = "https://investidor10.com.br/noticias/categoria/ver-todas/"

    def __init__(self):
        super().__init__("Investidor10")
        self.ticker_extractor = TickerExtractor()

    def extract(self):
        noticias = []
        res = requests.get(self.BASE_URL, headers=HEADERS)
        soup = BeautifulSoup(res.text, 'html.parser')
        artigos = soup.select(".news-container a")

        for artigo in artigos:
            try:
                link = artigo["href"]
                if not link.startswith("http"):
                    link = self.BASE_URL + link

                res_content = requests.get(link, headers=HEADERS)
                soup_content = BeautifulSoup(res_content.text, 'html.parser')
                article_component = soup_content.select_one(".news-container")

                titulo = article_component.select_one('.title').text.strip()
                corpo = article_component.select_one('.news-body').text.strip()

                data_str = article_component.select_one(".update-date.desktop").text.strip()

                match = re.search(r"(\d{2}/\d{2}/\d{4}) às (\d{2}:\d{2})h", data_str)

                if match:
                    data_str = match.group(1) + " " + match.group(2)
                    dt = datetime.strptime(data_str, "%d/%m/%Y %H:%M")

                    # Add Brazilian timezone
                    data_pub = dt.replace(tzinfo=ZoneInfo("America/Sao_Paulo"))

                imagem_url = article_component.select_one('.news-body img')["src"]

                conteudo_limpo = validar_conteudo_com_ia(titulo, corpo)
                resumo = gerar_resumo_com_ia(conteudo_limpo)
                tipo_categoria = capturar_tipo_por_conteudo(conteudo_limpo)
                
                # Extract tickers from title and content
                tickers_from_title = self.ticker_extractor.extract_tickers(titulo)
                tickers_from_content = self.ticker_extractor.extract_tickers(corpo)
                all_tickers = list(set(tickers_from_title + tickers_from_content))

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
                    "tickers": all_tickers
                })

                print(f"Adicionado: {titulo} | Tickers: {all_tickers}")
            except Exception as e:
                print(f"[ERRO] {e}")

        return noticias
