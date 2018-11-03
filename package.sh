#!/bin/bash

cd $(dirname $0)
exec zip "kswipe-$(jq -r '.version' src/manifest.json).zip" src/*
