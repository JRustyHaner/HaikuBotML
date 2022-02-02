# HaikuBotML

## Use the vagrant script to install for headless development
```vagrant up```

### For Browser testing
Browser based testing for quick development not involving Android or iOS webview build issues<br>
```meteor run```

You may have to run the following if you get a npm package error code 1 in vagrant:<br>
```rm -rf node_modules``` <br>
```mkdir ~/node_modules```<br>
```ln -s ~/node_modules```<br>
```npm install```<br><br>
