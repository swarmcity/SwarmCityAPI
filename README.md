# Swarm City API

[![Build Status](https://travis-ci.org/swarmcity/SwarmCityAPI.svg?branch=master)](https://travis-ci.org/swarmcity/SwarmCityAPI)
[![Coverage Status](https://coveralls.io/repos/github/swarmcity/SwarmCityAPI/badge.svg)](https://coveralls.io/github/swarmcity/SwarmCityAPI)

## Introduction

Slim API: A minimal version of the previous API that does two tasks:

- Support shortcodes. It needs a db service.
- Handle the chat. It needs a db service, and will need access to the blockchain.

## Usage

You can override the default ENV variables defined in `.env` by changing this file - or defining them as environment vars. You can check your current configuration with

`npm run show-config`

Once you are satisfied with the configuration, run

`npm install`

`npm start`

## Unit tests

`npm run test`

## Linting

`npm run lint`
