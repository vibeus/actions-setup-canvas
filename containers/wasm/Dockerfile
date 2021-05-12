FROM ubuntu:20.04

# Install 3rd party repositories
RUN apt-get update && apt-get -y install \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
RUN curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -

ARG NODE_VERSION=node_14.x
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

ARG CCACHE_VERSION=4.2.1
RUN curl -fsSL https://github.com/cristianadam/ccache/releases/download/v${CCACHE_VERSION}/Linux.tar.xz | tar -C /usr/bin -xJf -

WORKDIR /opt
RUN curl -fsSLO https://github.com/emscripten-core/emsdk/archive/main.zip && unzip main.zip && rm main.zip

ARG EMSDK_VERSION=2.0.20
WORKDIR /opt/emsdk-main
RUN ./emsdk install $EMSDK_VERSION && ./emsdk activate $EMSDK_VERSION
ENV EMSDK_VERSION=$EMSDK_VERSION

WORKDIR /
