import datetime
import sys
import time
import task

def format_time(time):
    if time < 10:
        return "0" + str(time)
    return str(time)

def main():
    while True:
        try:
            now = datetime.datetime.now()
            print(f"{format_time(now.hour)}:{format_time(now.minute)}")
            if now.hour == 21 and now.minute > 30:
                time.sleep(60 * 60 * 7) # 7 hours
            if now.hour > 21:
                time.sleep(60 * 60 * 5) # 5 hours
            if now.hour < 5:
                time.sleep(60 * 30) # 30 mins
            if now.hour == 5 and now.minute < 30:
                time.sleep(60 * 10) # 10 mins
            task.task()
        except KeyboardInterrupt:
            print("Shitting down")
            sys.exit(0)

main()
