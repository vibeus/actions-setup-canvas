FROM ubuntu:20.04

ARG CLANG_VERSION=12
ARG NODE_VERSION=node_14.x

# Install 3rd party repositories
RUN apt-get update && apt-get -y install \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

RUN curl -fsSL https://apt.llvm.org/llvm-snapshot.gpg.key | apt-key add -
RUN curl -fsSL https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add -
RUN curl -fsSL https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -

RUN echo "deb     http://apt.llvm.org/focal/ llvm-toolchain-focal-$CLANG_VERSION main" | tee /etc/apt/sources.list.d/llvm.list
RUN echo "deb-src http://apt.llvm.org/focal/ llvm-toolchain-focal-$CLANG_VERSION main" | tee -a /etc/apt/sources.list.d/llvm.list

RUN echo "deb     https://deb.nodesource.com/$NODE_VERSION focal main" | tee /etc/apt/sources.list.d/nodesource.list
RUN echo "deb-src https://deb.nodesource.com/$NODE_VERSION focal main" | tee -a /etc/apt/sources.list.d/nodesource.list

RUN echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

RUN apt-get update && DEBIAN_FRONTEND="noninteractive" apt-get -y install \
    clang-$CLANG_VERSION \
    clang-format-$CLANG_VERSION \
    cmake \
    nodejs \
    python3 \
    python3-pip \
    yarn \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

RUN update-alternatives --install /usr/bin/c++ c++ /usr/bin/clang++-$CLANG_VERSION 10
RUN update-alternatives --install /usr/bin/clang-format clang-format /usr/bin/clang-format-$CLANG_VERSION 10
RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 10
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 10
RUN update-alternatives --set c++ /usr/bin/clang++-$CLANG_VERSION
RUN update-alternatives --set clang-format /usr/bin/clang-format-$CLANG_VERSION
RUN update-alternatives --set python /usr/bin/python3
RUN update-alternatives --set pip /usr/bin/pip3
