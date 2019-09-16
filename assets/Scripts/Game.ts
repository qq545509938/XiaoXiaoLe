import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;

@ccclass
export default class Game extends cc.Component {

    @property(cc.Integer)
    row = 9;//行数

    @property(cc.Integer)
    col = 7;//列数

    @property(cc.Integer)
    gridWidth = 100;//格子宽度

    @property(cc.Integer)
    moveSpeed = 1500;//格子下落速度

    @property(cc.Node)
    gridRoot: cc.Node = null;//格子根节点

    @property([cc.SpriteFrame])
    bgImage: cc.SpriteFrame[] = [];//背景贴图

    @property([cc.SpriteFrame])
    itemImage: cc.SpriteFrame[] = [];//格子贴图

    @property(cc.SpriteFrame)
    selectImage: cc.SpriteFrame = null;

    @property(cc.Label)
    scoreLabel: cc.Label = null;

    @property(cc.ProgressBar)
    progressTime: cc.ProgressBar = null;

    @property(cc.Node)
    loseNode:

    gridDict: { [key: number]: Grid } = {};//背景格子

    itemDict: { [key: number]: Item } = {};//所有格子

    connectList: Item[] = [];//连接的格子

    moveDownList: Item[] = [];//下落的格子

    itemPool: cc.NodePool;

    score;

    time;

    start() {
        this.score = 0;
        this.time = 60;
        this.scoreLabel.string = this.score;
        this.itemPool = new cc.NodePool();
        this.initGrid();
    }

    initGrid() {
        for (let xIndex = 0; xIndex < this.col; xIndex++) {
            for (let yIndex = 0; yIndex < this.row; yIndex++) {
                let gridNode = new cc.Node("grid");
                this.gridRoot.addChild(gridNode);
                gridNode.setContentSize(this.gridWidth, this.gridWidth);
                gridNode.setPosition(xIndex * this.gridWidth, yIndex * this.gridWidth);
                this.gridDict[getGridID(xIndex, yIndex)] = new Grid(gridNode, xIndex, yIndex, this.bgImage[(yIndex + xIndex) % this.bgImage.length]);

                let itemNode = new cc.Node("item");
                this.gridRoot.addChild(itemNode);
                itemNode.setContentSize(this.gridWidth, this.gridWidth);
                itemNode.setPosition(xIndex * this.gridWidth, yIndex * this.gridWidth);
                itemNode.setScale(0);
                itemNode.runAction(cc.sequence(cc.delayTime(xIndex * 0.05 + yIndex * 0.05), cc.scaleTo(0.1, 1)));
                let type = this.randomType();
                let item = new Item(itemNode, xIndex, yIndex, type, this.itemImage[type]);
                item.pos = cc.v2(xIndex * this.gridWidth, yIndex * this.gridWidth);
                this.itemDict[item.id] = item;
            }
        }
    }

    onEnable() {
        this.node.on(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.on(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.on(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onDisable() {
        this.node.off(cc.Node.EventType.TOUCH_START, this.onTouchStart, this);
        this.node.off(cc.Node.EventType.TOUCH_MOVE, this.onTouchMove, this);
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
        this.node.off(cc.Node.EventType.TOUCH_CANCEL, this.onTouchEnd, this);
    }

    onTouchStart(eventTouch: cc.Event.EventTouch) {
        let pos = this.gridRoot.convertToNodeSpaceAR(eventTouch.getLocation());
        let x = Math.round(pos.x / this.gridWidth);
        let y = Math.round(pos.y / this.gridWidth);

        let item = this.itemDict[getGridID(x, y)];
        if (item != null) {
            let grid = this.gridDict[getGridID(x, y)];
            this.connectList.push(item);
            grid.sprite.spriteFrame = this.selectImage;

            for (let id in this.itemDict) {
                let temp = this.itemDict[id];
                if (temp.type != item.type) {
                    temp.node.opacity = 64;
                }
            }
        }
    }

    onTouchMove(eventTouch) {
        let pos = this.gridRoot.convertToNodeSpaceAR(eventTouch.getLocation());
        let x = Math.round(pos.x / this.gridWidth);
        let y = Math.round(pos.y / this.gridWidth);

        let item = this.itemDict[getGridID(x, y)];

        let lastItem = this.connectList[this.connectList.length - 1];
        if (this.connectList.indexOf(item) >= 0) {//滑动到已经连线的点
            if (item == this.connectList[this.connectList.length - 2]) {//如果滑动回倒数第二个
                this.connectList.pop();//去除最后一个连接点
                let lastGrid = this.gridDict[lastItem.id];
                lastGrid.sprite.spriteFrame = lastGrid.image;//还原背景
            }
        } else {
            //当前点在最后一个点相邻位置,记录该点
            if (item != null && item.type == lastItem.type
                && Math.abs(item.x - lastItem.x) <= 1 && Math.abs(item.y - lastItem.y) <= 1) {
                let grid = this.gridDict[getGridID(x, y)];
                this.connectList.push(item);
                grid.sprite.spriteFrame = this.selectImage;
            }
        }

    }

    onTouchEnd(eventTouch) {
        for (let id in this.itemDict) {
            let temp = this.itemDict[id];
            temp.node.opacity = 255;
        }

        let getScore = this.connectList.length >= 3;
        for (let i = 0; i < this.connectList.length; i++) {
            let item = this.connectList[i];
            let grid = this.gridDict[item.id];
            grid.sprite.spriteFrame = grid.image;

            if (getScore) {
                delete this.itemDict[item.id];
                this.itemPool.put(item.node);
            }
        }
        if(getScore){
            this.score += Math.ceil(Math.pow(this.connectList.length, 2) / 2)
        }

        this.scoreLabel.string = this.score;

        this.connectList = [];
        this.itemMoveDown();
    }

    //格子下落补充空格子
    itemMoveDown() {
        for (let xIndex = 0; xIndex < this.col; xIndex++) {

            let emptyGridPos = -1;

            for (let yIndex = 0; yIndex < this.row; yIndex++) {
                //当前时空格子
                if (!this.itemDict.hasOwnProperty(getGridID(xIndex, yIndex))) {
                    if (emptyGridPos == -1) {//只记录第一个空格子
                        emptyGridPos = yIndex;
                    }
                } else if (emptyGridPos != -1) {//格子下方存在空格子
                    //上方格子往下移补充空格子
                    let moveItem = this.itemDict[getGridID(xIndex, yIndex)];
                    moveItem.changePos(xIndex, emptyGridPos);
                    //格子下落目标位置
                    moveItem.pos = cc.v2(xIndex * this.gridWidth, emptyGridPos * this.gridWidth);
                    this.itemDict[getGridID(xIndex, emptyGridPos)] = moveItem;
                    this.moveDownList.push(moveItem);
                    delete this.itemDict[getGridID(xIndex, yIndex)];
                    ++emptyGridPos;//空格子往上移
                }
            }

            if (emptyGridPos == -1) {//如果不存在空格子需要补充,跳过新格子生成
                continue;
            }
            //上方所有非空格子往下移动完成后  需要生成新的格子来补充空格子
            for (let yIndex = emptyGridPos; yIndex < this.row; yIndex++) {
                let node = this.itemPool.get();
                if (!node) {
                    node = new cc.Node("item");
                    node.setContentSize(this.gridWidth, this.gridWidth);
                }
                this.gridRoot.addChild(node);
                //格子初始位置
                node.setPosition(xIndex * this.gridWidth, (this.row + yIndex - emptyGridPos) * this.gridWidth);
                let type = this.randomType();
                let item = new Item(node, xIndex, yIndex, type, this.itemImage[type]);
                //格子下落目标位置
                item.pos = cc.v2(xIndex * this.gridWidth, yIndex * this.gridWidth);
                this.itemDict[item.id] = item;
                this.moveDownList.push(item);
            }
        }
    }

    hint() {
        for (let xIndex = 0; xIndex < this.col - 2; xIndex++) {
            for (let yIndex = 0; yIndex < this.row - 2; yIndex++) {
                let item = this.itemDict[getGridID(xIndex, yIndex)];
            }
        }
    }

    update(dt) {

        for (let i = this.moveDownList.length - 1; i >= 0; i--) {
            let item = this.moveDownList[i];
            let pos = item.node.getPosition();
            if (pos.x > item.pos.x) {
                pos.x -= this.moveSpeed * dt;
                pos.x = pos.x <= item.pos.x ? item.pos.x : pos.x;
            } else {
                pos.x += this.moveSpeed * dt;
                pos.x = pos.x >= item.pos.x ? item.pos.x : pos.x;
            }

            if (pos.y > item.pos.y) {
                pos.y -= this.moveSpeed * dt;
                pos.y = pos.y <= item.pos.y ? item.pos.y : pos.y;

            } else {
                pos.y += this.moveSpeed * dt;
                pos.y = pos.y >= item.pos.y ? item.pos.y : pos.y;
            }

            item.node.setPosition(pos);

            if (pos.x == item.pos.x && pos.y == item.pos.y) {
                this.moveDownList.splice(i, 1);
            }
        }
        this.time -= dt;
        if(this.time <= 0){
            this.lose();
        }
    }

    lose(){

    }

    randomType() {
        return Math.floor(Math.random() * this.itemImage.length);
    }

}

class Grid {
    node: cc.Node;

    id: number;

    sprite: cc.Sprite;

    image: cc.SpriteFrame;

    constructor(node, x, y, image) {
        this.node = node;
        this.id = getGridID(x, y);
        this.image = image;
        this.sprite = node.addComponent(cc.Sprite);
        this.sprite.spriteFrame = image;
    }
}

class Item {

    node: cc.Node;

    type: number;

    x: number;
    y: number;

    id: number;

    pos: cc.Vec2;

    constructor(node, x, y, type, image) {
        this.node = node;
        this.id = getGridID(x, y);
        this.x = x;
        this.y = y;
        this.type = type;
        let sprite = node.getComponent(cc.Sprite);
        if (!sprite) sprite = node.addComponent(cc.Sprite);
        sprite.spriteFrame = image;
    }

    changePos(x, y) {
        this.x = x;
        this.y = y;
        this.id = getGridID(x, y);
    }
}

function getGridID(x, y) {
    return x * 100 + y;
}