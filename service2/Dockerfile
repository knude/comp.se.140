FROM ruby:3.2-slim

ENV BUNDLER_VERSION=2.5.3

RUN apt-get update && apt-get install -y --no-install-recommends build-essential git && rm -rf /var/lib/apt/lists/*

WORKDIR /service2

COPY Gemfile Gemfile.lock ./

RUN gem install bundler -v $BUNDLER_VERSION && bundle install

COPY . .

CMD ["bundle", "exec", "rackup", "-s", "puma", "-o", "0.0.0.0", "-p", "9292"]