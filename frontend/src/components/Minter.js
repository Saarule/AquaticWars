import { useEffect, useState } from "react";
import Web3 from "web3";
import contract from "../contracts/contract.json";
import Alt from "../assets/logo.png"
import OpenSea from "../assets/open-sea-logo.png"
import ImageMinter from "../assets/preview.png"

const initialInfoState = {
  connected: false,
  status: null,
  account: null,
  web3: null,
  contract: null,
  address: null,
  contractJSON: null,
};

const initialMintState = {
  loading: false,
  status: `Mint your ${contract.name} NFTs`,
  amount: 1,
  extendBubbleToNumber: 1,
  giveSteroidsToNumber: 1,
  eaterFishNumber: 1,
  eatenFishNumber: 1,
  supply: "0",
  cost: "0",
  giveSteroidsCost: "1000000000000000000", 
  extendBubbleCost: "1000000000000000000"  // 1 Matic
};

function Minter() {
  const [info, setInfo] = useState(initialInfoState);
  const [mintInfo, setMintInfo] = useState(initialMintState);

  console.log(info);

  const init = async (_request, _contractJSON) => {
    if (window.ethereum.isMetaMask) {
      try {
        const accounts = await window.ethereum.request({
          method: _request,
        });
        const networkId = await window.ethereum.request({
          method: "net_version",
        });
        if (networkId == _contractJSON.chain_id) {
          let web3 = new Web3(window.ethereum);
          setInfo((prevState) => ({
            ...prevState,
            connected: true,
            status: null,
            account: accounts[0],
            web3: web3,
            contract: new web3.eth.Contract(
              _contractJSON.abi,
              _contractJSON.address
            ),
            contractJSON: _contractJSON,
          }));
        } else {
          setInfo(() => ({
            ...initialInfoState,
            status: `Change network to ${_contractJSON.chain}.`,
          }));
        }
      } catch (err) {
        console.log(err.message);
        setInfo(() => ({
          ...initialInfoState,
        }));
      }
    } else {
      setInfo(() => ({
        ...initialInfoState,
        status: "Please install metamask.",
      }));
    }
  };

  const initListeners = () => {
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => {
        window.location.reload();
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }
  };

  const getSupply = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.totalSupply().encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params],
      });
      console.log(info.web3.utils.hexToNumberString(result));
      setMintInfo((prevState) => ({
        ...prevState,
        supply: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        supply: 0,
      }));
      getSupply();
    }
  };

  const getCost = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods.cost().encodeABI(),
    };
    try {
      const result = await window.ethereum.request({
        method: "eth_call",
        params: [params],
      });
      console.log(info.web3.utils.hexToNumberString(result));
      setMintInfo((prevState) => ({
        ...prevState,
        cost: info.web3.utils.hexToNumberString(result),
      }));
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        cost: "0",
      }));
      getCost();
    }
  };

  const mint = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      value: String(
        info.web3.utils.toHex(Number(mintInfo.cost) * mintInfo.amount + 100000000000000000) // The 100000000000000000 is solving an issuse of overflow numbers when calculating the price.
      ),
      data: info.contract.methods
        .mint()
        .encodeABI(),
    };
    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Minting ${mintInfo.amount}...`,
      }));
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [params],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! Your NFT will show up on Opensea, once the transaction is successful.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };

  const extendBubble = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      value: String(
        info.web3.utils.toHex(Number(mintInfo.extendBubbleCost)) 
      ),
      data: info.contract.methods
        .extendBubble(mintInfo.extendBubbleToNumber)
        .encodeABI(),
    };
    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Extending bubble...`,
      }));
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [params],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! You just extended a bubble.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };

  const giveSteroids = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      value: String(
        info.web3.utils.toHex(Number(mintInfo.giveSteroidsCost)) 
      ),
      data: info.contract.methods
        .takeSteroids(mintInfo.giveSteroidsToNumber)
        .encodeABI(),
    };
    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Giving steroids...`,
      }));
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [params],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! You just gave steroids to a fish.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };
  const eatFish = async () => {
    const params = {
      to: info.contractJSON.address,
      from: info.account,
      data: info.contract.methods
        .eat(mintInfo.eaterFishNumber, mintInfo.eatenFishNumber)
        .encodeABI(),
    };
    try {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: true,
        status: `Eating fish...`,
      }));
      const txHash = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [params],
      });
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status:
          "Nice! You just ate a fish.",
      }));
      getSupply();
    } catch (err) {
      setMintInfo((prevState) => ({
        ...prevState,
        loading: false,
        status: err.message,
      }));
    }
  };

  const updateExtendBubbleToNumber = (newNumber) => {
    if (newNumber >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        extendBubbleToNumber: newNumber,
      }));
    }
  };

  const updateGiveSteroidsToNumber = (newNumber) => {
    if (newNumber >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        giveSteroidsToNumber: newNumber,
      }));
    }
  };

  const updateEaterFishNumber = (newNumber) => {
    if (newNumber >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        eaterFishNumber: newNumber,
      }));
    }
  };

  const updateEatenFishNumber = (newNumber) => {
    if (newNumber >= 1) {
      setMintInfo((prevState) => ({
        ...prevState,
        eatenFishNumber: newNumber,
      }));
    }
  };


  const connectToContract = (_contractJSON) => {
    init("eth_requestAccounts", _contractJSON);
  };

  useEffect(() => {
    connectToContract(contract);
    initListeners();
  }, []);

  useEffect(() => {
    if (info.connected) {
      getSupply();
      getCost();
    }
  }, [info.connected]);

  return (
    <div className="page" >
      
      <div className="card">
        <div className="card_header">
          <img className="card_header_image ns" alt={Alt} src={ImageMinter} />
        </div>
        {mintInfo.supply < contract.total_supply ? (
          <div className="card_body">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              {/* ************** Spawn start here! ************** */}
              <div style={{ width: 10 }}></div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => mint()}
              >
                Spawn
              </button>
            </div>

            {/* ************** Spawn ends here! ************** */}
            {/* ************** Flex List start here! ************** */}

            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >

              </div>
            {info.connected ? (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {info.web3?.utils.fromWei(mintInfo.cost, "ether") *
                    mintInfo.amount}{" "}
                  {contract.chain_symbol}
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  |
                </p>
                <div style={{ width: 20 }}></div>
                <p style={{ color: "var(--statusText)", textAlign: "center" }}>
                  {mintInfo.supply}/{contract.total_supply}
                </p>
              </div>
            ) : null}
            {mintInfo.status ? (
              <p className="statusText">{mintInfo.status}</p>
            ) : null}
            {info.status ? (
              <p className="statusText" style={{ color: "var(--error)" }}>
                {info.status}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="card_body">
            <p style={{ color: "var(--statusText)", textAlign: "center" }}>
              {mintInfo.supply}/{contract.total_supply}
            </p>
            <p className="statusText">
              We've sold out! .You can still buy and trade the {contract.name}{" "}
              on marketplaces such as Opensea.
            </p>
          </div>
        )}
        <div className="card_footer colorGradient">
          <button
            className="button"
            style={{
              backgroundColor: info.connected
                ? "var(--success)"
                : "var(--warning)",
            }}
            onClick={() => connectToContract(contract)}
          >
            {info.account ? "Connected" : "Connect Wallet"}
          </button>
          {info.connected ? (
            <span className="accountText">
              {String(info.account).substring(0, 6) +
                "..." +
                String(info.account).substring(38)}
            </span>
          ) : null}
        </div>
        <a
          style={{
            position: "absolute",
            bottom: -25,
            left: 110,
            color: "#ffffff",
          }}
          target="_blank"
          href="https://polygonscan.com/address/0x15e9064bc16a1a59121556b5d99c1c5c288d9c51"
        >
          View Contract
        </a>
      </div>
      <div style={{ height: 20 }}></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 0fr)", gridGap: 10 }}>

                {/* ************** Bubble start here! ************** */}
                <div style={{width: 100}}>

                <div style={{ width: 10 }}></div>

                <div>Extend Bubble to fish number:</div>
                
                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateExtendBubbleToNumber(mintInfo.extendBubbleToNumber - 1)}
              >
                -
                </button>

                 {" #"+mintInfo.extendBubbleToNumber+" "} 

                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateExtendBubbleToNumber(mintInfo.extendBubbleToNumber + 1)}
              >
                +
              </button>

              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => extendBubble()}
              >
                Extend Bubble
              </button>
              </div>
                {/* ************** Bubble ends here! ************** */}
                {/* ************** Eat start here! ************** */}
               <div style={{width: 130}}>

                <div style={{ width: 10 }}></div>

                <div>Eat fish number:</div>

                <div style={{paddingLeft:"25px"}}>
                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateEatenFishNumber(mintInfo.eatenFishNumber - 1)}
                >
                -
                </button>

                {" #"+mintInfo.eatenFishNumber+" "} 

                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateEatenFishNumber(mintInfo.eatenFishNumber + 1)}
                >
                +
                </button>
                </div>

                <div>with fish number:</div>

                <div style={{paddingLeft:"25px"}}>
                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateEaterFishNumber(mintInfo.eaterFishNumber - 1)}
                >
                -
                </button>

                {" #"+mintInfo.eaterFishNumber+" "} 

                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateEaterFishNumber(mintInfo.eaterFishNumber + 1)}
                >
                +
                </button>
                </div>

                <button style={{marginLeft: 17}}
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => eatFish()}
                >
                Eat Fish
                </button>
                </div>
                {/* ************** Eat ends here! ************** */}
                {/* ************** Steroids start here! ************** */}
                <div style={{width: 100}}> 

              <div style={{ width: 10 }}></div>

              <div>Give Steroids to fish number: </div>
              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateGiveSteroidsToNumber(mintInfo.giveSteroidsToNumber - 1)}
              >
                -
                </button>

                {" #"+mintInfo.giveSteroidsToNumber+" "} 

                <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="small_button"
                onClick={() => updateGiveSteroidsToNumber(mintInfo.giveSteroidsToNumber + 1)}
              >
                +
              </button>

              <button
                disabled={!info.connected || mintInfo.cost == "0"}
                className="button"
                onClick={() => giveSteroids()}
              >
                Give Steroids
              </button>
              </div>
                {/* ************** Steroids ends here! ************** */}
  </div>
  
  <div style={{ height: 20 }}></div>

      <div style={{color:"#c2feff"}}>
      Aquatic Wars is 100% on-chain, dynamic, NFT game.
      </div>
      <div style={{color:"#c2feff"}}>
      <div style={{ height: 20 }}></div>

      How to play Aquatic Wars:
      </div>
      <ul class="a" >
      <li >The goal of the game is simple: <div style={{color:"#c2feff"}}><i>become the biggest fish in the ocean. </i></div></li>
      <li>Fish can eat other fish only if they are significantly bigger than them.</li>
      <li>Fish grow in size by eating other fish.</li>
      <li>When a fish spawns, it has a protective bubble for one day. During that time period, other fish can't eat it.</li>
      <li>Fish can take steroids to increase their size. </li>
      <li>Every time a fish takes steroids, it increases that fish size by one.</li>
      <li>Fish can extend their protective bubble or take steroids by paying fee.</li>
      <li>Eating smaller fish is free!</li>
      <li>When a fish has been eaten, the fish is no longer appears in the NFT's image.</li>
      <li>When someone spawns a fish, the minting price increases by 0.1%.</li>
      </ul  >
      <div style={{color:"#c2feff"}}>
      Do you think you have what it takes to become the biggest fish in the ocean?
      </div>
      <div style={{ height: 10 }}></div>

      <div> 
        <a href="https://opensea.io/collection/aquaticwars" target="_blank" rel="noopener noreferrer">
        <img src={OpenSea} height={25} width={25}/>
        </a>
      </div>
      <div style={{ height: 5 }}></div>

    </div>
  );
}

export default Minter;
