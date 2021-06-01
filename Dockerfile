FROM node:16

# Create app directory
WORKDIR /usr/src/app

COPY package.json yarn.lock ./

RUN yarn

# Bundle app source
COPY . .

ENTRYPOINT [ "node", "app.js" ]