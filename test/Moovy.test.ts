import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  MockToken,
  MockToken__factory,
  Moovy,
  Moovy__factory,
  MoovyTokenSale,
  MoovyTokenSale__factory
} from "../typechain";
import { ethers } from "hardhat";
import { beforeEach } from "mocha";
import { expect } from "chai";
import { parseEther } from "ethers/lib/utils";

const ADVISORS = '0x00781266C0e25bfd385685a5F4c1c9C9D0D47cDc';
const TEAM_MEMBERS = '0xA911361263eacC9579eaA29bF14056Ee887968DF';
const PLAY_TO_EARN = '0x51fF21c11845c1C83A2e9D0C35852dA84fdA84D5';
const ECOSYSTEM = '0x0bA88421c5F99184F060daB9158A4cEfBcF1F3c1';
const MARKETING = '0xAA2C53096aFd874B848e420173b9f7bE4Db16107';
enum AllocationGroup {
   Advisors, TeamMembers, PlayToEarn, EcosystemFund, Marketing
}

const increaseDate = async (days: number) => {
  await ethers.provider.send('evm_increaseTime', [days * 24 * 60 * 60]);
  await ethers.provider.send('evm_mine', []);
}
describe("Moovy", () => {
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  let moovy: Moovy;
  let tokenSale: MoovyTokenSale;
  let usdt: MockToken;

  let moovy_factory: Moovy__factory;
  let tokenSale_factory: MoovyTokenSale__factory;
  let usdt_factory: MockToken__factory;

  before(async () => {
    moovy_factory = await ethers.getContractFactory("Moovy");
    tokenSale_factory = await ethers.getContractFactory("MoovyTokenSale");
    usdt_factory = await ethers.getContractFactory("MockToken");
  })

  beforeEach(async () => {
   [owner, alice, bob] = await ethers.getSigners();

   moovy = await moovy_factory.deploy();
   await moovy.deployed();

   usdt = await usdt_factory.deploy();
   await usdt.deployed();

   tokenSale = await tokenSale_factory.deploy(usdt.address, moovy.address);
   await tokenSale.deployed();

   await moovy.setTokenSale(tokenSale.address);
   await moovy.setTGEPassed();
  })

  it("should mint tokens", async () => {
    expect(await moovy.totalSupply()).eq(parseEther('100000000'))
  })

  it('should transfer tokens to token sale', async () => {
    expect(await moovy.balanceOf(tokenSale.address)).eq(parseEther('27000000'))
  })

  describe("Advisors distribution", () => {
    it('should distribute cliff', async() => {
      await increaseDate(5 * 30);
      await moovy.distribute(AllocationGroup.Advisors);
      expect(await moovy.balanceOf(ADVISORS)).closeTo(parseEther('100000'), parseEther('10'))
    });

    it('should distribute all tokens', async () => {
      await increaseDate(23 * 30);
      await moovy.distribute(AllocationGroup.Advisors);
      expect(await moovy.balanceOf(ADVISORS)).eq(parseEther('2000000'))
    })
  })

  describe("Team members distribution", () => {
    it('should distribute cliff', async() => {
      await increaseDate(2 * 30);
      await moovy.distribute(AllocationGroup.TeamMembers);
      expect(await moovy.balanceOf(TEAM_MEMBERS)).closeTo(parseEther('2400000'), parseEther('10'))
    });

    it('should distribute all tokens', async () => {
      await increaseDate(9 * 30);
      await moovy.distribute(AllocationGroup.TeamMembers);
      expect(await moovy.balanceOf(TEAM_MEMBERS)).eq(parseEther('12000000'))
    })
  })

  describe("Play to earn distribution", () => {
    it('should distribute cliff', async() => {
      await moovy.distribute(AllocationGroup.PlayToEarn);
      expect(await moovy.balanceOf(PLAY_TO_EARN)).closeTo(parseEther('7500000'), parseEther('100'))
    });

    it('should distribute all tokens', async () => {
      await increaseDate(6 * 30);
      await moovy.distribute(AllocationGroup.PlayToEarn);
      expect(await moovy.balanceOf(PLAY_TO_EARN)).eq(parseEther('30000000'))
    })
  })

  describe("Ecosystem fund distribution", () => {
    it('should distribute cliff', async() => {
      await moovy.distribute(AllocationGroup.EcosystemFund);
      expect(await moovy.balanceOf(ECOSYSTEM)).closeTo(parseEther('3000000'), parseEther('100'))
    });

    it('should distribute all tokens', async () => {
      await increaseDate(12 * 30);
      await moovy.distribute(AllocationGroup.EcosystemFund);
      expect(await moovy.balanceOf(ECOSYSTEM)).eq(parseEther('15000000'))
    })
  })

  describe("Marketing distribution", () => {
    it('should distribute cliff', async() => {
      await increaseDate(9 * 30);
      await moovy.distribute(AllocationGroup.Marketing);
      expect(await moovy.balanceOf(MARKETING)).closeTo(parseEther('2100000'), parseEther('100'))
    });

    it('should distribute all tokens', async () => {
      await increaseDate(36 * 30);
      await moovy.distribute(AllocationGroup.Marketing);
      expect(await moovy.balanceOf(MARKETING)).eq(parseEther('14000000'))
    })
  })

})