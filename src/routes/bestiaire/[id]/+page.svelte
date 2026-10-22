<script lang="ts">
    import MjPanel from "$lib/components/game/MjPanel.svelte";
    import PatternBackground from "$lib/components/layout/PatternBackground.svelte";
    import { parseDragons } from "$lib/game/labels";

    let { data, form } = $props();

    let monster = $derived(data.monster);
    let dragons = $derived(parseDragons(monster.dragon));

    const MAX_DANGER = 10;
</script>

<svelte:head>
    <title>{monster.name} : Bestiaire</title>
</svelte:head>

<PatternBackground />

<main>
    <div class="infos">
        <div class="portrait">
            <img src={monster.image} alt="Illustration de {monster.name}" />
        </div>
        <div class="details">
            <h1>{monster.name}</h1>
            <dl>
                <div>
                    <dt>Taille</dt>
                    <dd>{monster.size}</dd>
                </div>
                <div>
                    <dt>Poids</dt>
                    <dd>{monster.weight}</dd>
                </div>
                <div>
                    <dt>Danger</dt>
                    <dd>
                        <span
                            class="danger"
                            role="meter"
                            aria-label="Niveau de danger"
                            aria-valuenow={monster.dangerosity}
                            aria-valuemin={0}
                            aria-valuemax={MAX_DANGER}
                        >
                            <span
                                style="width: {Math.min(100, (monster.dangerosity / MAX_DANGER) * 100)}%"
                            ></span>
                        </span>
                        {monster.dangerosity} / {MAX_DANGER}
                    </dd>
                </div>
            </dl>
            <div class="effect">
                <h2>Effet</h2>
                <p>{monster.effect}</p>
            </div>
        </div>
        {#if dragons.length > 0}
            <div class="dragons" class:many={dragons.length > 1} title="Descendance de {dragons.join(', ')}">
                {#each dragons as dragon (dragon)}
                    <img
                        src="/dragons/normal/{dragon}.svg"
                        alt="Descendance de {dragon}"
                        class="primary-svg"
                    />
                {/each}
            </div>
        {/if}
    </div>

    <div class="description">
        <p>{monster.description}</p>
    </div>

    {#if data.stats}
        <MjPanel
            stats={data.stats}
            editHref="/admin/monstres/{monster.id}"
            message={form?.message}
            flags={[
                { name: "visibility", label: "Visible des joueurs", checked: !!monster.visibility },
                { name: "current", label: "Arc actuel", checked: !!monster.current },
            ]}
        />
    {/if}
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        gap: 4rem;
        padding: 3rem 0;
    }

    .infos {
        display: flex;
        align-items: center;
        gap: 3rem;
        width: 65%;
        margin: 0 auto;
    }

    .portrait {
        width: 22rem;
        max-width: 40%;
        aspect-ratio: 1;
        flex-shrink: 0;
        border: 3px solid var(--primary);
        border-radius: var(--radius);
        overflow: hidden;
        background-color: #101010;
    }

    .portrait img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .details {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
    }

    h1 {
        font-size: 2.5rem;
    }

    h2 {
        font-size: 1.2rem;
        color: var(--primary);
        margin-bottom: 0.25rem;
    }

    dl {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
    }

    dl > div {
        display: flex;
        gap: 0.75rem;
        align-items: center;
    }

    dt {
        width: 4.5rem;
        text-decoration: underline;
    }

    dd {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    .danger {
        display: block;
        width: 8rem;
        height: 0.6rem;
        border-radius: 999px;
        background-color: rgba(255, 255, 255, 0.08);
        overflow: hidden;
    }

    .danger span {
        display: block;
        height: 100%;
        background-color: var(--Chronos);
    }

    .effect p,
    .description {
        white-space: pre-line;
    }

    /* Un logo par dragon de la descendance, empilés ; plus petits quand il y en a plusieurs. */
    .dragons {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 5rem;
        flex-shrink: 0;
    }

    .dragons.many {
        width: 4rem;
    }

    .dragons img {
        width: 100%;
    }

    .description {
        width: 65%;
        margin: 0 auto;
        text-align: justify;
    }

    @media screen and (max-width: 900px) {
        .infos {
            flex-direction: column;
            width: 92%;
            gap: 1.5rem;
        }

        .portrait {
            max-width: 100%;
            width: 100%;
        }

        .dragons,
        .dragons.many {
            flex-direction: row;
            width: auto;
        }

        .dragons img {
            width: 4rem;
        }

        .description {
            width: 90%;
        }
    }
</style>
