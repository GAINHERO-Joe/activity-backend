# 二开推荐阅读[如何提高项目构建效率](https://developers.weixin.qq.com/miniprogram/dev/wxcloudrun/src/scene/build/speed.html)
FROM node:16-alpine

# 容器默认时区为UTC，如需使用上海时间请启用以下时区设置命令
# RUN apk add tzdata && cp /usr/share/zoneinfo/Asia/Shanghai /etc/localtime && echo Asia/Shanghai > /etc/timezone

# 安装证书
RUN apk --no-cache add ca-certificates

# 安装依赖包，如需其他依赖包，请到alpine依赖包管理(https://pkgs.alpinelinux.org/packages?name=php8*imagick*&branch=v3.13)查找。
# 选用国内镜像源以提高下载速度
RUN sed -i 's/dl-cdn.alpinelinux.org/mirrors.tencent.com/g' /etc/apk/repositories \
&& apk add --update --no-cache nodejs npm

# 创建工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 使用官方npm源
RUN npm config set registry https://registry.npmjs.org/

# npm 安装依赖
RUN npm install

# 复制所有文件
COPY . .

# 暴露端口
EXPOSE 80

# 环境变量
ENV PORT=80
ENV NODE_ENV=production
ENV DEBUG=express:*

# 启动命令
CMD ["sh", "-c", "node app.js 2>&1 | tee /tmp/app.log"]
