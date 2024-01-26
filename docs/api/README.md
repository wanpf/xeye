# API 文档    
请根据实际环境，替换本文档演示用的用户ID：52-54-00-B8-84-04_DESKTOP-5SI23LH       
## 1. 查看版本信息 
命令  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/api/version
```
结果  
```bash
{
  "pipy": "Version     : 0.99.0-15\r\nCommit      : 5e647d8a98b503d76068bbc0fd6e29b7255d725a\r\nCommit Date : Thu, 4 Jan 2024 18:17:54 -0800\r\nHost        : Windows-10.0.22621 AMD64\r\nOpenSSL     : OpenSSL 3.2.0 23 Nov 2023\r\nBuiltin GUI : Yes\r\nSamples     : Yes\r\n",
  "proxy-script": "v1.2"
}
```
## 2. 查看电脑信息  
命令  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/api/info
```
结果  
```bash
{
  "systemProxy": "on",
  "hostname": "DESKTOP-5SI23LH",
  "osName": "Microsoft Windows 10",
  "osVersion": "10.0.19045 N/A Build 19045",
  "lastBootUptime": "2024/1/4, 8:53:24",
  "cpuInfo": "Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",
  "ipAddress": "192.168.122.242",
  "mac": "52-54-00-B8-84-04"
}
```
## 3. 工具类  
1、download  
在 GUI 上操作如下  
<img width="611" alt="image" src="https://github.com/polaristech-io/desktop-accelerator/assets/2276200/07e2c689-212a-4967-8e19-385430a4f4b9">

2、ping  
在 GUI 上操作如下  
<img width="643" alt="image" src="https://github.com/polaristech-io/desktop-accelerator/assets/2276200/6f91d5bf-d10d-42c5-9ad2-ff6f9465d00e">

## 4. 查询 osqueryi 接口  
*注意：pjs的tools目录下只有windows版本osqueryi.exe,如在linux等系统，请先下载osqueryi并拷贝到pjs/tools目录下*  
命令1  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/os -d "SELECT * FROM routes WHERE destination = '::1'"
```
结果  
```bash
[
  {"destination":"::1","flags":"-1","gateway":"::","interface":"","metric":"331","mtu":"2147483647","netmask":"128","source":"","type":"local"}
]
```
命令2  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/os -d "SELECT url, round_trip_time, response_code FROM curl WHERE url = 'http://www.showip.com/'"
```
结果  
```bash
[
  {"response_code":"200","round_trip_time":"1735888","url":"http://www.showip.com/"}
]
```
## 5. 上传升级包  
### 5.1 打包  
将最新的 pjs 目录，使用如下命令，打包成 pjs.tar 文件   
*注意：不要使用压缩*
```bash
tar cvf pjs.tar pjs
```
### 5.2 上传(upload)  
命令  
```bash
curl -v -H "trust: flomesh" --upload-file pjs.tar http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/upload/
```
结果  
```bash
OK
```
## 6. 升级(upgrade)  
命令
```bash
curl -v -H "trust: flomesh" http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/upgrade?pjs.tar
```
结果
```bash
x pjs/admin/assets/NotFound-7e3d0329.js
x pjs/admin/assets/Documentation-ec173c4c.css
x pjs/admin/assets/primeicons-90a58d3a.woff
x pjs/admin/assets/index-47ce5ea9.js
x pjs/upload.js
x pjs/proxy-main.js
* Connection #0 to host 192.168.122.242 left intact
```
## 7. 回滚(rollback)  
命令
```bash
curl -v -H "trust: flomesh" http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/rollback
```
结果
```bash
OK
```
## 8. 设置 system-proxy 为 on (只支持 windows 版本）  
命令  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/api/invoke -d '{"verb": "enable-proxy"}'
```
结果  
```bash
{
  "status": "OK",
  "result": {
    "output": "The operation completed successfully.\r\r\nThe operation completed successfully.\r\r\n"
  }
}
```
## 9. 设置 system-proxy 为 off (只支持 windows 版本）  
命令  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/api/invoke -d '{"verb": "disable-proxy"}'
```
结果  
```bash
{
  "status": "OK",
  "result": {
    "output": "The operation completed successfully.\r\r\nThe operation completed successfully.\r\r\n"
  }
}
```
## 10. 查询 system-proxy 的状态  
命令  
```bash
curl -v http://192.168.12.84:8001/52-54-00-B8-84-04_DESKTOP-5SI23LH/api/info
```
结果  
```
{
  "systemProxy": "on",
  "hostname": "DESKTOP-5SI23LH",
  "osName": "Microsoft Windows 10",
  "osVersion": "10.0.19045 N/A Build 19045",
  "lastBootUptime": "2024/1/12, 19:09:32",
  "cpuInfo": "Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",
  "ipAddress": "192.168.122.242",
  "mac": "52-54-00-B8-84-04"
}
```
其中的 "systemProxy"，on: 设置了系统代理，off: 关闭了 系统代理。  
