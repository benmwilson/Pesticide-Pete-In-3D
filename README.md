<p align="center">
  <img src="https://i.imgur.com/bkdCa4S.jpeg" alt="logo" width="20%"/>
</p>
<h1 align="center">
  Pesticide Pete In 3D
</h1>
<p align="center">
  
</p>

<p align="center">
 Pesticide Pete In 3D is a simple three-dimensional interactive point-and-click game where you fight off a hoard of corn-eating pests from ravaging your last corn field using your trusty toolbelt of pesticides! This is a simple game made with WebGL where you drag around the globe and click on the bugs to spray them with pesticides in order to kill them before they eat all your corn!
</p> 

<p align="center">
  🚧
 This game was developed for the COSC 414 Computer Graphics course at the University of British Columbia Okanagan.
  🚧
</p>


## Table of Contents

- [Documentation](#documentation)
- [Contributors](#contributors)
- [Completed Features](#completed-features)
  - [Bonus Features](#bonus-features)

### Documentation
 - [Game Instructions](Documentation/COSC%20414%203D%20Game%20Instructions.pdf)
 - [Picture Gallery](Documentation/COSC%20414%203D%20Picture%20Gallery.pdf)

### Contributors
 - [Ben Wilson](https://github.com/benmwilson)
 - [Nigam Lad](https://github.com/NigamLad)
 - [Brendan Zapf](https://github.com/bigz4)
 
### Completed Features
 
1. [x] The playing field starts as surface of a spherecentered at the origin.
2. [x] The player can dragthe sphereto rotate to look for bacteria(under interactive control).
3. [x] Bacteria grow on the surfaceof the spherestarting at an arbitrary spot on the surfaceand growing out uniformly in alldirectionsfrom that spot at a speed determined by the game.
4. [x] The player needs to eradicate the bacteria by placing the mouse over the bacteria and hitting a button.
5. [x] The effect of the poison administered is to immediately remove the poisoned bacteria.
6. [x] The game can randomly generate up to a fixed number (say 10) of different bacteria (eachwitha different color).
7. [x] The bacteria appear as a colored circular patchon the surfaceof the sphere.
8. [x] The game gains points through the delays in the user responding and by any specific bacteria reaching a threshold (for example,a diameter of a 30-degree arcon a great circle of the sphere).
9. [x] The player wins if all bacteria are poisoned before any two different bacteria reach the threshold mentioned above.
 
#### Bonus Features
 
1. [ ] The effect of the poison administered also propagates outward from the point of insertion of the position until all the bacteria are destroyed.
2. [ ] When two bacteria cultures collide, the first one to appear on the surfacedominates and consumes the later generated bacteria.
3. [ ] When a bacterial culture is hit, use a simple 2D particle system to simulate an explosion at the point where the poison is administered.
4. [ ] Lighting is used. Use GUI control to enable or disable lighting.
