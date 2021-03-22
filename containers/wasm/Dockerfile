FROM ubuntu:20.04

ARG EMSDK_VERSION=2.0.13
ARG NODE_VERSION=node_14.x

# Install 3rd party repositories
RUN apt-get update && apt-get -y install \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
RUN curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -

RUN echo "deb     https://deb.nodesource.com/$NODE_VERSION focal main" | tee /etc/apt/sources.list.d/nodesource.list
RUN echo "deb-src https://deb.nodesource.com/$NODE_VERSION focal main" | tee -a /etc/apt/sources.list.d/nodesource.list

RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get -y install \
    cmake \
    git \
    git-lfs \
    nodejs \
    python3 \
    python3-pip \
    yarn \
    zlib1g-dev \
    zip \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 10
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 10
RUN update-alternatives --set python /usr/bin/python3
RUN update-alternatives --set pip /usr/bin/pip3

RUN curl -fsSL https://github.com/cristianadam/ccache/releases/download/v3.7.7/Linux.tar.xz | tar -C /usr/bin -xJf -

WORKDIR /opt
RUN curl -fsSLO https://github.com/emscripten-core/emsdk/archive/master.zip && unzip master.zip && rm master.zip

WORKDIR /opt/emsdk-master
RUN ./emsdk install $EMSDK_VERSION && ./emsdk activate $EMSDK_VERSION
ENV EMSDK_VERSION=$EMSDK_VERSION

WORKDIR /