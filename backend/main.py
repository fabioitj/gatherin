import schedule
import time
from websites.infomoney import start_infomoney
from websites.moneytimes import start_moneytimes

def hourly_task():
    start_infomoney()
    start_moneytimes()

schedule.every().hour.do(hourly_task)
hourly_task()

print("Agendador iniciado... Ctrl+C para parar.")
while True:
    schedule.run_pending()
    time.sleep(1)
