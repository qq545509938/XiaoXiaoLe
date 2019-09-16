// Learn TypeScript:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/typescript.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/reference/attributes.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - [Chinese] https://docs.cocos.com/creator/manual/zh/scripting/life-cycle-callbacks.html
//  - [English] http://www.cocos2d-x.org/docs/creator/manual/en/scripting/life-cycle-callbacks.html


import ccclass = cc._decorator.ccclass;
import property = cc._decorator.property;

@ccclass
export default class ControlNode extends cc.Component {

    @property(cc.Node)
    control: cc.Node = null;

    @property
    active = true;

    // LIFE-CYCLE CALLBACKS:

    // onLoad () {}

    start () {
        this.node.on("click", this.onClick, this);
    }

    onClick(){
        if(this.control){
            this.control.active = this.active;
        }
    }

    // update (dt) {}
}
