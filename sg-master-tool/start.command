#!/bin/bash
cd "$(dirname "$0")"
npm start &
sleep 2
open http://localhost:3000
