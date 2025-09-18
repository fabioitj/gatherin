from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=OPENAI_API_KEY)

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

def capturar_tipo_por_conteudo(content: str) -> str:
    prompt = f"""

Siga estritamente as regras abaixo:

1. Se o conteúdo for relacionado a **fundos imobiliários**, responda exatamente: **FII**
2. Se o conteúdo for sobre qualquer outro tipo de ativo, como ações, BDRs, ETFs ou empresas listadas, responda exatamente: **ACOES**
3. Não escreva nada além de **FII** ou **ACOES**
4. Não use acentos, variações ou palavras adicionais.

Agora analise o conteúdo a seguir e responda conforme as regras:

CONTEÚDO:

\"\"\"{content}\"\"\"

RESPOSTA (apenas "ACOES" ou "FII"):
"""
    response = client.chat.completions.create(
        model="gpt-4.1-nano",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.2,
        max_tokens=512
    )
    return response.choices[0].message.content.strip()