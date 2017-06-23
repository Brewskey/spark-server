

#
# based on Alpine Node (version 8 is tested, other Version should work as well)
#
FROM mhart/alpine-node:7

RUN npm install bunyan -g

# create the Working Directory
RUN mkdir -p /usr/src/app

COPY package.json /usr/src/app/ 

# Set Working Directory
WORKDIR /usr/src/app

RUN npm install

COPY *.js /usr/src/app/ 


ENTRYPOINT ["npm", "run", "start:prod"]





