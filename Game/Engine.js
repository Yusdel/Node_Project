
let GameObject = function (x, y, width, height){

    this.position = {x : x, y : y};
    this.width = width;
    this.height = height;

    this.isCollided = (GameObject) => {

        if (this.position.x < GameObject.position.x + GameObject.width  && 
            this.position.x + this.width  > GameObject.position.x &&
            this.position.y < GameObject.position.y + GameObject.height && 
            this.position.y + this.height > GameObject.position.y ){
            return true;
        }
    
        return false;
    
    }

}

module.exports = {
    GameObject : GameObject
}