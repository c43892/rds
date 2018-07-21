del client_wxgame\platform.js
rd client_wxgame\openDataContext /Q /S

pause

copy /Y wxgame\platform.js client_wxgame\platform.js
xcopy wxgame\openDataContext client_wxgame\openDataContext\ /E /Y
