FROM amazonlinux:latest

RUN yum install -y \
    clang \
    cmake3 \
    git \
    git-lfs \
    gzip \
    make \
    tar \
    xz \
    zlib-devel \
    && yum clean all \
    && rm -rf /var/cache/yum

RUN update-alternatives --install /usr/bin/python python /usr/bin/python3 10
RUN update-alternatives --install /usr/bin/pip pip /usr/bin/pip3 10
RUN update-alternatives --install /usr/bin/cmake cmake /usr/bin/cmake3 10
RUN update-alternatives --set python /usr/bin/python3
RUN update-alternatives --set pip /usr/bin/pip3
RUN update-alternatives --set cmake /usr/bin/cmake3

ARG CCACHE_VERSION=4.2.1
RUN curl -fsSL https://github.com/cristianadam/ccache/releases/download/v${CCACHE_VERSION}/Linux.tar.xz | tar -C /usr/bin -xJf -

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
RUN . ~/.nvm/nvm.sh && nvm install 14 && nvm use 14

ENV PATH=/root/.nvm/versions/node/v14.17.0/bin:$PATH
RUN npm install -g yarn

RUN pip install awscli

ENV CC=clang
ENV CXX=clang++
