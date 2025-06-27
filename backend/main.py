import schedule
import time
from websites.infomoney import InfoMoney
from websites.moneytimes import MoneyTimes

def hourly_task():
    InfoMoney().start()
    MoneyTimes().start()
    
schedule.every().hour.do(hourly_task)
hourly_task()

print("Agendador iniciado... Ctrl+C para parar.")
while True:
    schedule.run_pending()
    time.sleep(1)
