FROM node:latest

WORKDIR /wt24p19382

COPY package.json package.json
COPY package-lock.json package-lock.json
RUN npm install

COPY . .

EXPOSE 8080
CMD ["node", "index.js"]