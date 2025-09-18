from bs4 import BeautifulSoup
from datetime import datetime
import requests
from lib.openai import gerar_resumo_com_ia, validar_conteudo_com_ia
from lib.https import HEADERS
from abstract.website import Website
from lib.ticker_extractor import TickerExtractor

class InfoMoney(Website):
    BASE_URL = "https://www.infomoney.com.br"
    LIST_URL = f"{BASE_URL}/cotacoes/b3/"

    def __init__(self):
        super().__init__("InfoMoney")
        self.ticker_extractor = TickerExtractor()

    def extract(self):
        noticias = []
        for tipo_categoria in ["FII", "ACOES"]:
            url_suffix = "fii/" if tipo_categoria == "FII" else "acao/"
            res = requests.get(self.LIST_URL + url_suffix, headers=HEADERS)
            soup = BeautifulSoup(res.text, 'html.parser')
            artigos = soup.select(".article-card")

            for artigo in artigos:
                try:
                    link = artigo.select_one(".article-card__asset a")["href"]
                    if not link.startswith("http"):
                        link = self.BASE_URL + link

                    res_content = requests.get(link, headers=HEADERS)
                    soup_content = BeautifulSoup(res_content.text, 'html.parser')

                    titulo = soup_content.select_one('h1').text.strip()
                    corpo = soup_content.select_one('.im-article').text.strip()
                    data_str = soup_content.select("time")[0].text.strip()
                    data_pub = datetime.strptime(data_str, "%d/%m/%Y %Hh%M")
                    imagem_url = artigo.select_one('img')["src"]

                    conteudo_limpo = validar_conteudo_com_ia(titulo, corpo)
                    resumo = gerar_resumo_com_ia(conteudo_limpo)
                    
                    # Extract tickers from title and content
                    tickers_from_title = self.ticker_extractor.extract_tickers(titulo)
                    tickers_from_content = self.ticker_extractor.extract_tickers(conteudo_limpo)
                    all_tickers = list(set(tickers_from_title + tickers_from_content))

                    noticias.append({
                        "title": titulo,
                        "summary": resumo,
                        "content": conteudo_limpo,
                        "imageUrl": imagem_url,
                        "source": self.nome_fonte,
                        "sourceUrl": link,
                        "publishedAt": data_pub.isoformat(),
                        "category": tipo_categoria,
                        "tags": [],
                        "tickers": all_tickers
                    })

                    print(f"Adicionado: {titulo} | Tickers: {all_tickers}")
                except Exception as e:
                    print(f"[ERRO] {e}")

        return noticias
