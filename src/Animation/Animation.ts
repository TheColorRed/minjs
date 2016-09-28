class Animation {

    private static config: {
        animations: [
            {
                target: string | string[],
                trigger: string | string[],
                apply?: string | string[],
                duration?: string,
                action?: {
                    moveTo?: { x?: string, y?: string },
                    moveFrom?: { x?: string, y?: string },
                    scaleTo?: { sx?: string | number, sy?: string | number },
                    scaleFrom?: { sx?: string | number, sy?: string | number },
                    rotateTo?: { angle?: string | number },
                    rotateFrom?: { angle?: string | number },
                    skewTo?: { ax?: string | number, ay: string | number },
                    skewFrom?: { ax?: string | number, ay: string | number },
                    fgColorTo?: { color: string },
                    fgColorFrom?: { color: string },
                    bgColorTo?: { color: string },
                    bgColorFrom?: { color: string },
                    fadeTo?: { color: number },
                    fadeFrom?: { color: number }
                }
            }
        ]
    };

    private static init(content: any) {
        Animation.config = content;
        window.addEventListener('onDomChange', (event: CustomEvent) => {
            let mutations: MutationRecord[] = event.detail;
            mutations.forEach(mutation => {
                console.log(mutation.addedNodes)
                if (mutation.addedNodes.length > 0) {
                    this.addListeners();
                }
            })
        });
    }

    private static addListeners() {
        Animation.config.animations.forEach(animation => {
            let targetArray: string[] = [];
            if (typeof animation.target == 'string') {
                targetArray.push(animation.target);
            }
            let targets: NodeListOf<HTMLElement> = document.querySelectorAll(targetArray.join(',')) as NodeListOf<HTMLElement>;
            let applies: NodeListOf<HTMLElement>;
            if (animation.apply) {
                let applyArray: string[] = [];
                if (typeof animation.apply == 'string') {
                    applyArray.push(animation.apply);
                }
                applies = document.querySelectorAll(applyArray.join(',')) as NodeListOf<HTMLElement>;
            }
            let duration = animation.duration || '1s';
            for (let i = 0; i < targets.length; i++) {
                let target = targets[i];
                if (typeof animation.trigger == 'string') {
                    target.addEventListener(animation.trigger, function (event) {
                        if (!animation.apply) {
                            target.style.transform = `translateX(${animation.action.moveTo.x}) ${duration}, translateY(${animation.action.moveTo.y}) ${duration}`;
                        }
                    });
                }
            }
        });
    }

}