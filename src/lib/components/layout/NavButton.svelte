    <script lang="ts">
        let { href, label, active } = $props();
    </script>
<style>
    .nav-link{
        display: flex;
        align-items: center;
        justify-content: center;
        text-align: center;
        position: relative;
        width: 100%;
        height: 100%;
        border-left: 1px solid var(--primary);
        transition: opacity ease-in-out 800ms;
        font-size: 20px;
        z-index: 999;
        background-color: var(--background);
    }
    .background{
        width: 100%;
        height: 100%;
        background-size: cover;
        top: 0;
        left: 0;
        position: absolute;
        background-image: url('/layout/Tampon_Mapping_active.png');
        opacity: 40%;
        z-index: 998;
        transition: all ease-in-out 400ms;
        filter: invert(100%);
    }
    .active{
        background-image: url('/layout/Tampon_Mapping_active.png');
        filter: invert(0%);
    }

    .nav-link:hover > .background{
        filter: invert(0%);
    }

    p{
        z-index: 1001;
    }
    
    @media screen and (max-width: 600px) {
        .nav-link{
            padding: 20px 0;
            border-bottom: 1px solid var(--primary);
            border-left: none;
        }
    }
</style>
    <a href={href} class="nav-link">
        <div class="background {active ? 'active' : ''}"></div>
        <p>
            {label}
        </p>
    </a>
