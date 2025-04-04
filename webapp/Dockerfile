FROM node:22

COPY . /app
WORKDIR /app

#Install the dependencies
RUN npm install  --ignore-scripts

ARG API_URI="http://localhost:8003"
ARG LLM_API_KEY
ARG REACT_APP_API_GATEWAY
ARG REACT_APP_LLM
ARG REACT_APP_HISTORY
ENV REACT_APP_API_ENDPOINT=$API_URI
ENV REACT_APP_LLM_API_KEY=$LLM_API_KEY
ENV REACT_APP_API_GATEWAY=$REACT_APP_API_GATEWAY
ENV REACT_APP_LLM=$REACT_APP_LLM
ENV REACT_APP_HISTORY=$REACT_APP_HISTORY

#Create an optimized version of the webapp
RUN npm run build
RUN npm install serve

#Execute npm run prod to run the server
#CMD [ "npm", "run", "prod" ]
CMD ["npm", "start"]
