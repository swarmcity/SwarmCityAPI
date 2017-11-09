FROM node:6
WORKDIR /root
ENV HOME /root

COPY package.json ./
RUN npm install

COPY contracts ./contracts
COPY handlers ./handlers
COPY functions ./functions
COPY scheduler ./scheduler
COPY subscriptions ./subscriptions
COPY tasks ./tasks
COPY socket.js ./
COPY environment.js ./
COPY globalweb3.js ./
COPY logs.js ./
COPY server.js ./
COPY tasks.js ./
COPY validators.js ./

EXPOSE 8011
CMD [ "node", "server.js" ]
