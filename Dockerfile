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
COPY *.js ./

EXPOSE 8011
ENTRYPOINT [ "node" ]

