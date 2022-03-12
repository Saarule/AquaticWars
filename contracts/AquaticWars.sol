// SPDX-License-Identifier: MIT

pragma solidity >=0.8.0 <0.9.0;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./Base64.sol";
import "./Fish.sol";
import "./AliveFishWithBubble.sol";
import "./DeadFish.sol";

contract AquaticWars is ERC721Enumerable, Ownable {
  using Strings for uint256;

   struct Aqua { 
      string name;
      string fishType;
      string description;
      string fishColor1;
      string fishColor2;
      string fishColor3;
      bool alive;
      uint256 spwanTimestamp;
      uint256 size;
      uint256 bubbleStillOnUntilTimestamp;
      uint256 deathTimestamp;
   }
   
   mapping (uint256 => Aqua) public aquas;
   uint256 public cost = 1 ether;
   uint256 public extendBubbleCost = 1 ether;
   uint256 public takeSteroidsCost = 1 ether;

   event Eaten (uint256 indexed _eaterId, uint256 indexed _eatenId);
   
   constructor() ERC721("AquaticWars", "AQUA") {}

  function mint() public payable {
    uint256 supply = totalSupply();
    
    Aqua memory newAqua = Aqua(
        string(abi.encodePacked('Aquatic Wars #', uint256(supply + 1).toString())), 
        "AquaFish",
        "Aquatic Wars is 100% on-chain, dynamic, NFT game.",        
        randomNum(361, block.difficulty+10, supply).toString(),
        randomNum(361, block.timestamp, supply+20).toString(),
        randomNum(361, block.difficulty+30, block.timestamp).toString(),
        true,
        block.timestamp,
        1,
        block.timestamp + 1 days,
        0
        );
    
    if (msg.sender != owner()) {
      require(msg.value >= cost);
    }
    
    aquas[supply + 1] = newAqua;
    _safeMint(msg.sender, supply + 1);
    cost = (cost * 1001) / 1000;

}

  function randomNum(uint256 _mod, uint256 _seed, uint _salt) public view returns(uint256) {
      uint256 num = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, _seed, _salt)));
      num = uint(keccak256(abi.encodePacked(block.timestamp, msg.sender, _seed, _salt, num))) % _mod;
      return num;
  }

  function getAquaByIndex(uint256 _tokenId) public view returns(Aqua memory) {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return aqua;
  }

  function getSize(uint256 _tokenId) public view returns(uint256) {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return aqua.size;
  }

  function hasBubble(uint256 _tokenId) public view returns(bool){
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return ((int(block.timestamp) - int(aqua.bubbleStillOnUntilTimestamp)) < 0);
  }

  function eat(uint256 _eaterId, uint256 _eatenId) public {
    require(_exists(_eaterId),"ERC721Metadata: Query for nonexistent token");
    require(_exists(_eatenId),"ERC721Metadata: Query for nonexistent token");
    require(ownerOf(_eaterId) == msg.sender,"You are not the owner's of the eater Aqua");
    require(isAlive(_eatenId),"Eaten Id has already been eaten");
    require(isAlive(_eaterId),"Eater Id has already been eaten");
    Aqua storage eater = aquas[_eaterId];
    Aqua storage eaten = aquas[_eatenId];
    require(eater.size > eaten.size, "Eater is not big enough to eat this fish");
    require(!hasBubble(_eatenId),"You can't eat fish with a protective bubble");

    if(getSize(_eaterId) > getSize(_eatenId) && !hasBubble(_eatenId)){
        eaten.alive = false;
        eater.size = eater.size + 1;
        eaten.deathTimestamp = block.timestamp;
        emit Eaten(_eatenId, _eaterId);
    }
  }

  function extendBubble(uint256 _tokenId) payable public {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    require(isAlive(_tokenId),"Eaten Id has already been eaten");
    if (msg.sender != owner()) {
        require(msg.value >= takeSteroidsCost, "You need to pay to take steroids");
    }
    Aqua storage aqua = aquas[_tokenId];
    if(hasBubble(_tokenId)){
        aqua.bubbleStillOnUntilTimestamp = aqua.bubbleStillOnUntilTimestamp + 1 days;
    }else{
        aqua.bubbleStillOnUntilTimestamp = block.timestamp + 1 days;
    }
  }

  function takeSteroids(uint256 _tokenId) payable public {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    require(isAlive(_tokenId),"Eaten Id has already been eaten");
    if (msg.sender != owner()) {
        require(msg.value >= takeSteroidsCost, "You need to pay to take steroids");
    }
    Aqua storage aqua = aquas[_tokenId];
    aqua.size = aqua.size + 1;
    console.log("aqua.size: " , aqua.size);
  }

  function timeAlive(uint256 _tokenId) public view returns(uint256) {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return block.timestamp - aqua.spwanTimestamp;
  }

  function calculateDaysAlive(uint256 _tokenId) public view returns(uint256) {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return ((block.timestamp - aqua.spwanTimestamp) / 86400)+1;
  }

  function isAlive(uint256 _tokenId) public view returns(bool) {
    require(_exists(_tokenId),"ERC721Metadata: Query for nonexistent token");
    Aqua memory aqua = aquas[_tokenId];
    return aqua.alive;
  }
  
  function buildImage(uint256 _tokenId) public view returns(string memory) {
    Aqua memory currentAqua = aquas[_tokenId];
    uint256 daysAlive = calculateDaysAlive(_tokenId); 
    uint256 size = getSize(_tokenId);
    uint256 dimensions1 = 4800-size;
    uint256 dimensions2 = 10980-(size*2);
    if(dimensions1 < 0){
        dimensions1 = 0;
        dimensions2 = 1380;
    }
    uint256 backgroundFinsColor1 = randomNum(361, block.difficulty, _tokenId+100);
    if(currentAqua.alive == false){
        bytes memory imagePart1 = DeadFish.Fish2String();
        bytes memory imagePart2 = bytes(
            abi.encodePacked(
                '<text x="35" y="80" class="small"># ',_tokenId.toString(),'</text>',
                '</svg>'
            )
        );
        string memory svg = Base64.encode(bytes(
          abi.encodePacked(
              imagePart1,
              imagePart2
          )
         ));
        return svg;
    }else{
        bytes memory imagePart1 = AliveFishWithBubble.Fish2StringPart1();
        bytes memory imagePart2 = bytes(
                abi.encodePacked(
                    '<defs>',
                    '<linearGradient cx="0.25" cy="0.25" r="0.75" id="gradFish" gradientTransform="rotate(90)">',
                    '<stop offset="0%" stop-color="hsl(',currentAqua.fishColor1,', 90%, 40%)"/>',
                    '<stop offset="50%" stop-color="hsl(',currentAqua.fishColor2,', 90%, 37%)"/>',
                    '<stop offset="100%" stop-color="hsl(',currentAqua.fishColor3,', 90%, 37%)"/>',
                    '</linearGradient>',
                    '</defs>'
                )
            );
        bytes memory imagePart3 = bytes(
                abi.encodePacked(
                    '<defs>',
                    '<linearGradient cx="0.25" cy="0.25" r="0.75" id="gradFishFin" gradientTransform="rotate(90)">',
                    '<stop offset="0%" stop-color="hsl(',backgroundFinsColor1.toString(),', 80%, 40%)"/>',
                    '<stop offset="50%" stop-color="hsl(',(backgroundFinsColor1+70).toString(),', 80%, 37%)"/>',
                    '<stop offset="100%" stop-color="hsl(',(backgroundFinsColor1+200).toString(),', 80%, 37%)"/>',
                    '</linearGradient>',
                    '</defs>'
                )
            );
        if(hasBubble(_tokenId)){
            bytes memory imagePart4 = AliveFishWithBubble.Fish2StringPart4();
            bytes memory imagePart5 = bytes(
                    abi.encodePacked(
                        '<svg viewBox="-',dimensions1.toString(),' -',dimensions1.toString(),' ',dimensions2.toString(),' ',dimensions2.toString(),'">'
                    )
                    
                );
            bytes memory imagePart6 = Fish.Fish2String();
            bytes memory imagePart7 = bytes(
                    abi.encodePacked(
                        '<text x="35" y="80" class="small"># ',_tokenId.toString(),'</text>',
                        '<text x="530" y="80" class="small">Days Alive: ',daysAlive.toString(),'</text>',
                        '<text x="35" y="1330" class="small">Size: ',size.toString(),'</text>',
                        '</svg>'
                    )
                );
            string memory svg = Base64.encode(bytes(
                abi.encodePacked(
                    imagePart1,
                    imagePart2,
                    imagePart3,
                    imagePart4,
                    imagePart5,
                    imagePart6,
                    imagePart7
                )
            ));
            return svg;
        }else{
        bytes memory imagePart4 = bytes(
                abi.encodePacked(
                    '<rect width="1380" height="1380" fill="url(#gradBackground)"/>',
                    '<svg viewBox="-',dimensions1.toString(),' -',dimensions1.toString(),' ',dimensions2.toString(),' ',dimensions2.toString(),'">'
                )
                
            );
        bytes memory imagePart5 = Fish.Fish2String();
        bytes memory imagePart6 = bytes(
                abi.encodePacked(
                    '<text x="35" y="80" class="small"># ',_tokenId.toString(),'</text>',
                    '<text x="465" y="80" class="small">Days Alive: ',daysAlive.toString(),'</text>',
                    '<text x="35" y="1330" class="small">Size: ',size.toString(),'</text>',
                    '</svg>'
                )
            );
        string memory svg = Base64.encode(bytes(
            abi.encodePacked(
                imagePart1,
                imagePart2,
                imagePart3,
                imagePart4,
                imagePart5,
                imagePart6
            )
        ));
        return svg;
        }
    }
  }
  
  function buildMetadata(uint256 _tokenId) public view returns(string memory) {
      Aqua memory currentImage = aquas[_tokenId];
      return string(abi.encodePacked(
              'data:application/json;base64,', Base64.encode(bytes(abi.encodePacked(
                          '{"name":"', 
                          currentImage.name,
                          '", "description":"', 
                          currentImage.description,
                          '", "image": "', 
                          'data:image/svg+xml;base64,', 
                          buildImage(_tokenId),
                          '"}')))));
  }

  function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
    require(_exists(_tokenId),"ERC721Metadata: URI query for nonexistent token");
    return buildMetadata(_tokenId);
  }

  function setMintCost(uint256 _newCost) public onlyOwner() {
    cost = _newCost;
  }
  
  function setBubbleCost(uint256 _newCost) public onlyOwner() {
    extendBubbleCost = _newCost;
  }
  
  function setSteroidsCost(uint256 _newCost) public onlyOwner() {
    takeSteroidsCost = _newCost;
  }

  function withdraw() public payable onlyOwner {
    (bool os, ) = payable(owner()).call{value: address(this).balance}("");
    require(os);
  }
}