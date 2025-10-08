#!/bin/bash
cd /home/kavia/workspace/code-generation/component-analysis-and-logic-enhancement-3326-3337/frontend_react
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

