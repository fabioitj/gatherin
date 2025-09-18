class Website:
    def __init__(self, nome_fonte: str):
        self.nome_fonte = nome_fonte

    def start(self):
        print(f'Iniciando web scraping no site {self.nome_fonte}.')
        noticias = self.extract()
        from lib.db import salvar_noticias_no_postgres
        salvar_noticias_no_postgres(noticias)

    def extract(self):
        raise NotImplementedError("Este método deve ser implementado pelas subclasses.")