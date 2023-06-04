# Raspberry Pi Config

- after flashing sd with raspian headless (using rpi imager)
- remove sd, then re insert
- open rootfs/boot in terminal
- `touch wpa_supplicant.conf`
- add 
```
country=US # Your 2-digit country code
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
network={
    ssid="YOUR_NETWORK_NAME"
    psk="YOUR_PASSWORD"
    key_mgmt=WPA-PSK
}
```
- `touch ssh`
- remove sd card
- insert into pi and boot
- pi may take a while to boot initially
- (insert commands to add on-reboot.sh)
- `touch on-reboot.sh`
- `chmod +x on-reboot.sh`
- `crontab -e`
- (in cron tab) `@reboot sh /home/pi/on-reboot.sh`
- (insert commands to make it executable and run on start)
- (see if you can add those to the sd before even starting it)
- (day 1, try to have it just get the new install, then immediately run on start)
