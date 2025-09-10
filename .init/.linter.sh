#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-qa-assistant-34089-34098/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

