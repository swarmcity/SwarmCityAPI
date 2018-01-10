FROM node:6
WORKDIR /root
ENV HOME /root

COPY package.json ./
RUN npm install

COPY connections ./connections
COPY contracts ./contracts
COPY functions ./functions
COPY jobs ./jobs
COPY scheduler ./scheduler
COPY services ./services
COPY subscriptions ./subscriptions
COPY tasks ./tasks
COPY *.js ./

EXPOSE 8011
CMD [ "node", "server.js" ]
