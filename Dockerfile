FROM node
WORKDIR /root
ENV HOME /root

COPY package.json ./
RUN npm install

COPY contracts ./contracts
COPY functions ./functions
COPY scheduler ./scheduler
COPY subscriptions ./subscriptions
COPY tasks ./tasks
COPY jobs ./jobs
COPY *.js ./

EXPOSE 8011
CMD [ "node", "server.js" ]
