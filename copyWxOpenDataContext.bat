del client_wxgame\platform.js
rd client_wxgame\openDataContext /Q /S
rd client_wxgame\library /Q /S

pause

copy /Y wxgame\platform.js client_wxgame\platform.js
xcopy wxgame\openDataContext client_wxgame\openDataContext\ /E /Y
xcopy wxgame\library client_wxgame\library\ /E /Y

rd client_wxgame\resource\assets\effect /Q /S
rd client_wxgame\resource\assets\font /Q /S
rd client_wxgame\resource\assets\items /Q /S
rd client_wxgame\resource\assets\monsters /Q /S
rd client_wxgame\resource\assets\occupation /Q /S
rd client_wxgame\resource\assets\props /Q /S
rd client_wxgame\resource\assets\relics /Q /S
rd client_wxgame\resource\assets\ui /Q /S
rd client_wxgame\resource\config /Q /S

pause
