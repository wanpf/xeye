# 结构图  
<img width="1451" alt="image" src="https://github.com/polaristech-io/desktop-accelerator/assets/2276200/d2a13b94-b439-4c36-bd4c-c1bdfc6be0c0">

# API 定义
架构图中红色箭头所示  
登陆接口：
http://192.168.12.84:8001/api/login
请求数据，
例子 终端:  
```bash
{
  "user": "flomesh",
  "password": "flomesh"
}
```

例子 服务端:  
```bash
{
  "user": "admin",
  "password": "admin123"
}
```
返回数据格式：  
```bash
{
  "token": "ZmxvbWVzaDpmbG9tZXNo",
}
```
访问接口需要加令牌：
```bash
'Authorization: Basic ZmxvbWVzaDpmbG9tZXNo'
```
## 1、获取客户ID，列表  
GET 方式，返回 json 字符串  
http://192.168.12.84:8001/users  
返回数据格式：  
```bash
[
  "90-78-41-30-6C-2C_DESKTOP-SD01LPM",
  "52-54-00-DE-0F-7E_DESKTOP-I3MV7B5",
  "52-54-00-B8-84-04_DESKTOP-5SI23LH",
]
```
## 2、访问用户 GUI 页面  

http://192.168.12.84:8001/ + 客户ID方式  
http://192.168.12.84:8001/90-78-41-30-6C-2C_DESKTOP-SD01LPM/  

## 3、获取用户电脑信息  
http://192.168.12.84:8001/ + 客户ID + /api/info  
http://192.168.12.84:8001/90-78-41-30-6C-2C_DESKTOP-SD01LPM/api/info  
返回数据格式：  
```bash
{
  "hostname": "DESKTOP-5SI23LH",
  "osName": "Microsoft Windows 10",
  "osVersion": "10.0.19045  Build 19045",
  "lastBootUptime": "2023/12/26, 10:27:09",
  "cpuInfo": "Intel64 Family 6 Model 154 Stepping 3 GenuineIntel ~2496 Mhz",
  "ipAddress": "192.168.122.242",
  "mac": "52-54-00-B8-84-04"
}
```

## 4、网络测试  
访问地址:  
http://192.168.12.84:8001/ + 客户ID + /api/invoke  
http://192.168.12.84:8001/90-78-41-30-6C-2C_DESKTOP-SD01LPM/api/invoke  
POST 方式，请求数据格式：  
请求数据，例子1:  
```bash
{
  "verb": "download",
  "target": "http://www.flomesh.cn/download/bigfile"
}
```
返回数据：   
```bash
{
  "status": "OK", // 或者 "FAIL"
  "message": "错误提示"， // 非必须，错误时才有
  "result": {
    "time": 5000  // 耗时  5000 毫秒
  }
}
```
请求数据，例子2:  
```bash
{
  "verb": "ping",
  "target": "10.10.10.1"
}
```
返回数据：   
```bash
{
  "status": "OK", // 或者 "FAIL"
  "message": "错误提示"， // 非必须，错误时才有
  "result": {
    "loss": "0",   // 丢失率 0:  %0, 10: 10% 
    "min": 94.60,  // 时间单位 ms
    "avg": 108.04, // 时间单位 ms
    "max": 138.54  // 时间单位 ms
  }
}
```

# 高级api  
## 5、客户端，服务端口映射配置 （TODO）
