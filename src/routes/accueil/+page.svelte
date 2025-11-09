<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
        const header = document.querySelectorAll('header');
        header.forEach((element) => {
            element.style.display = 'none';
        });

        const body = document.querySelector('body');

        if(body){
            body.style.overflowX = 'hidden';
            body.style.overflowY = 'hidden';
        }

        hoverFragment();
    });

    let altFragment = $state('Représentation d\'un morceau de verre brisé en 6');
    let fragmentIllustration = $state("Vide");

    let toutX = $state(2);
    let toutY = $state(50);

    function movingBackground(valueX: number, valueY: number, fragment: string, alt: string) {
        toutX = valueX;
        toutY = valueY;

        changeFragment(fragment, alt);
    }

    function changeFragment(value: string, alt: string) {
        fragmentIllustration = value;
        altFragment = 'Représentation d\'un morceau de verre brisé en ' + alt;
    }

    let centrale = $state([31, 8, 25]); 
    let haut_gauche = $state([20, -7, 25.5]);
    let haut = $state([19, -5, 32]);
    let haut_droite = $state([9, 12, 19]);
    let bas_gauche = $state([13, 15, 40]);
    let bas_droite = $state([20, -1.5, 6]);
    let title = $state('Accueil : Last Fragment');


    function hoverFragment(){

        const personnages = document.getElementById('LPersonnages');
        const outils = document.getElementById('LOutils');
        const histoires = document.getElementById('LHistoires');
        const connexion = document.getElementById('LConnexion');
        const flux = document.getElementById('LFlux');
        const background = document.querySelector('.background');

        //#######PERSONNAGES#######
        personnages?.addEventListener('mouseover', () => {
            centrale = [31, 11, 22];
            bas_droite = [20, -4, 3.5];
            haut_gauche = [20, -5, 27.5];
            haut = [19, -3.8, 30.8];
            haut_droite = [9, 12.8, 18.2];
            bas_gauche = [13, 14.5, 39.5];
        })

        //#######OUTILS#######
        outils?.addEventListener('mouseover', () => {
            centrale = [31, 9.5, 23.5];
            bas_droite = [20, -2.75, 4.75];
            haut_gauche = [20, -6, 26.5];
            haut = [19, -4.4, 31.4];
            haut_droite = [9, 12.4, 18.6];
            bas_gauche = [13, 14.75, 39.75];
        })

        //#######HISTOIRES#######
        histoires?.addEventListener('mouseover', () => {
            centrale = [31, 8, 25];
            bas_droite = [20, -1.5, 6];
            haut_gauche = [20, -7, 25.5];
            haut = [19, -5, 32];
            haut_droite = [9, 12, 19];
            bas_gauche = [13, 15, 40];
        })

        //#######CONNEXION#######
        connexion?.addEventListener('mouseover', () => {
            centrale = [31, 6.5, 26.5];
            bas_droite = [20, -0.25, 7.25];
            haut_gauche = [20, -8, 24.5];
            haut = [19, -5.6, 32.6];
            haut_droite = [9, 11.6, 19.4];
            bas_gauche = [13, 15.25, 40.25];
        })

        //#######FLUX#######
        flux?.addEventListener('mouseover', () => {
            centrale = [31, 5, 28];
            bas_droite = [20, 1, 8.5];
            haut_gauche = [20, -9, 23.5];
            haut = [19, -6.2, 33.2];
            haut_droite = [9, 11.2, 19.8];
            bas_gauche = [13, 15.5, 40.5];

            title = "Je te vois."
        })

        flux?.addEventListener('mouseout', () => {
            title = "Accueil : Last Fragment";
        })
    }

</script>

<svelte:head>
    <title>{title}</title>
</svelte:head>


<div class="body">
    <div class="background">
        
    </div>

    <div class="tout" style="top: {toutY}%; right: {toutX}%;">
        <img src="/accueil/LeTout.png" alt="Logo de Last Fragment, Le Tout">
    </div>

    <div class="fragment">
        <img src="/accueil/Fragments/{fragmentIllustration}/Centrale.png" class="centrale" alt="{altFragment}" 
        style="width: {centrale[0]}%; top: {centrale[1]}%; right: {centrale[2]}%">

        <img src="/accueil/Fragments/{fragmentIllustration}/Haut.png" class="haut" alt="" 
        style="width: {haut[0]}%; top: {haut[1]}%; right: {haut[2]}%">

        <img src="/accueil/Fragments/{fragmentIllustration}/Haut_Gauche.png" class="haut_gauche" alt="" 
        style="width: {haut_gauche[0]}%; top: {haut_gauche[1]}%; left: {haut_gauche[2]}%">

        <img src="/accueil/Fragments/{fragmentIllustration}/Haut_Droite.png" class="haut_droite" alt="" 
        style="width: {haut_droite[0]}%; top: {haut_droite[1]}%; right: {haut_droite[2]}%">

        <img src="/accueil/Fragments/{fragmentIllustration}/Bas_Droite.png" class="bas_droite" alt="" 
        style="width: {bas_droite[0]}%; bottom: {bas_droite[1]}%; right: {bas_droite[2]}%">

        <img src="/accueil/Fragments/{fragmentIllustration}/Bas_Gauche.png" class="bas_gauche" alt="" 
        style="width: {bas_gauche[0]}%; bottom: {bas_gauche[1]}%; right: {bas_gauche[2]}%">
    </div>
    
    <div class="links">
        <ul>
            <li><a href="/personnages" id="LPersonnages" onmouseenter={() => movingBackground(3, 49, 'Personnages', '6 personnages')}>Personnages</a><div class="brillance"></div></li>
            <li><a href="/outils" id="LOutils" onmouseenter={() => movingBackground(2.5, 49.5, 'Outils', '6 schémas d\'outils')}>Outils</a><div class="brillance"></div></li>
            <li><a href="/histoires" id="LHistoires" onmouseenter={() => movingBackground(2, 50, 'Vide', '6 Livres')}>Histoires</a><div class="brillance"></div></li>
            <li><a href="/auth/login" id="LConnexion" onmouseenter={() => movingBackground(1.5, 50.5, 'Connexion', '1 porte enchaînée')}>Connexion</a><div class="brillance"></div></li>
            <li><a href="/flux" id="LFlux" onmouseenter={() => movingBackground(1, 51, 'Don_de_flux', '12 Oeils t\'observants')}>Ton don de flux</a><div class="brillance" style="background-color: var(--primary);"></div></li>
        </ul>
    </div>
</div>
    
<style>
.body{
    overflow-x: none;
    overflow-y: hidden;
}

.tout{
    width: 75%;
    position: absolute;
    transform: translateY(-50%);
    z-index: -1;
    opacity: 60%;
    transition: all ease-in-out 400ms;
}

.tout > img{
    width: 100%;
}

.background{
    width: 40%;
    height: 40vw;
    background-color: var(--foreground);
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 100%;
    z-index: -2;
    filter: blur(150px);
    opacity: 5%;
}

.links{
    width: 30%;
    position: absolute;
    top: 50%;
    left: 5%;
    transform: translateY(-50%);
    font-family: var(--titleFont);
    font-size: 64px;
    text-align: center;
    line-height: 1.4;
    z-index: 10;
}

li{
    position: relative;
}

.brillance{
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    left: 0;
    background-color: var(--accent);
    z-index: -1;
    filter: blur(50px);
    opacity: 0;

    transition: all ease-in-out 400ms;
}

a{
    z-index: 1000;
    opacity: 0.3;
    padding: 10px;

    transition: all ease-in-out 400ms;
}

a:hover + .brillance, .brillance:hover, a:focus + .brillance{
    opacity: 0.7;
}

a:hover, a:focus{
    opacity: 1;
    font-size: 72px;
}

.fragment{
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow-y: hidden;
    top: 0;
    left: 0;
}

.fragment > img{
    position: absolute;
    transition: all ease-in-out 400ms;
}

.centrale{
    z-index: 999;
    filter: drop-shadow(0px 0px 30px black);
}

.haut{
    z-index: 996;
    filter: drop-shadow(0px 25px 15px black);
}

.haut_gauche{
    z-index: 997;
    filter: drop-shadow(25px 25px 20px black);
}

.haut_droite{
    z-index: 995;
    filter: drop-shadow(-25px 10px 12px black);
}

.bas_droite{
    z-index: 998;
    filter: drop-shadow(-25px -25px 25px black);
}

.bas_gauche{
    z-index: 994;
    filter: drop-shadow(15px -10px 10px black);
}

@media (max-width: 600px) {
    .links{
        width: 90%;
        font-size: 40px;
        text-align: left;
    }

    a{
        opacity: 0.9;
    }

    a:hover{
        font-size: 42px;
    }

    .fragment{
        display: none;
    }
}

</style>