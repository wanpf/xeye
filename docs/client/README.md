# 一、启动 xeye 服务  
需要在运行服务的机器上先安装 pipy、openssl(3.0以上版本）这2个可执行程序，另外，9090、6060 这2个端口需要可用。     
pipy 可以从 https://github.com/flomesh-io/pipy/releases 下载。  
## 1. 下载工程
```bash
git clone https://github.com/polaristech-io/desktop-accelerator.git
```
## 2. 启动服务  
```bash
pipy desktop-accelerator/client/pjs/main.js
```
# 二、使用浏览器测试效果  
## 1. 安装CA根证书
  将 CA.crt 证书安装到系统，或者安装到浏览器。    
## 2. 给浏览器设置 http、https 代理  
  代理地址 127.0.0.1:9090    
## 3. 浏览器访问 
  访问 https//www.gov.cn/ 等网站      
## 4. 查看 GUI 网页  
  浏览器访问 http://127.0.0.1:6060/ (用户名：flomesh  密码：flomesh ） 
  效果如下:  
<img width="1895" alt="image" src="https://github.com/polaristech-io/desktop-accelerator/assets/2276200/6971518a-ac6b-4ad2-bf99-3241b19b8587">
