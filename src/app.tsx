import React, { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Grid,
  ImageCard,
  MultilineInput,
  Rows,
  Select,
  Text,
  Title,
  TypographyCard,
} from "@canva/app-ui-kit";
import {
  addNativeElement,
  ui,
  FontWeight,
  TextAttributes,
  getCurrentPageContext,
  initAppElement, Placement,
} from "@canva/design";
import { upload } from "@canva/asset";
import { useSelection } from "utils/use_selection_hook";
import { auth } from "@canva/user";
import styles from "styles/components.css";
import dog from "assets/images/dog.jpg";
import cat from "assets/images/cat.jpg";
import rabbit from "assets/images/rabbit.jpg";
import weather from "assets/images/weather.png";
import {Validation} from "@canva/app-ui-kit/dist/cjs/ui/base/validation/validation";
import State = Validation.State;

const BACKEND_URL = `${BACKEND_HOST}/custom-route`;

type DraggableTextProperties = {
  textAlign: TextAttributes["textAlign"];
  fontWeight: FontWeight;
  fontStyle: TextAttributes["fontStyle"];
  decoration: TextAttributes["decoration"];
};

const content = "Add a little bit of body text";

const uploadExternalImage = () => {
  return upload({
    mimeType: "image/jpeg",
    thumbnailUrl:
        "https://www.canva.dev/example-assets/image-import/grass-image-thumbnail.jpg",
    type: "IMAGE",
    url: "https://www.canva.dev/example-assets/image-import/grass-image.jpg",
    width: 320,
    height: 212,
  });
};

const uploadLocalImage = (imageSrc) => {
  return upload({
    mimeType: "image/jpeg",
    thumbnailUrl: imageSrc,
    type: "IMAGE",
    url: imageSrc,
    width: 100,
    height: 100,
  });
};

const insertLocalImage = async (imageSrc) => {
  const { ref } = await uploadLocalImage(imageSrc);
  await addNativeElement({ type: "IMAGE", ref });
};

const insertExternalImage = async () => {
  const { ref } = await uploadExternalImage();
  await addNativeElement({ type: "IMAGE", ref });
};

const enum ElementPlacement {
  DEFAULT = "default",
  TOP_LEFT = "top_left",
  TOP_RIGHT = "top_right",
  BOTTOM_LEFT = "bottom_left",
  BOTTOM_RIGHT = "bottom_right",
}

type AppElementData = {
  imageId: string;
};

type UIState = AppElementData & {
  placement?: ElementPlacement;
  isEditingAppElement: boolean;
};

const images = {
  dog: {
    title: "Weather",
    imageSrc: weather,
    imageRef: undefined,
  },
  cat: {
    title: "Cat",
    imageSrc: cat,
    imageRef: undefined,
  },
  rabbit: {
    title: "Rabbit",
    imageSrc: rabbit,
    imageRef: undefined,
  },
};

const initialState: UIState = {
  imageId: "dog",
  placement: ElementPlacement.DEFAULT,
  isEditingAppElement: false,
};

const appElementClient = initAppElement<AppElementData>({
  render: (data) => {
    return [
      {
        type: "IMAGE",
        ref: images[data.imageId].imageRef,
        top: 0,
        left: 0,
        width: 400,
        height: 400,
      },
    ];
  },
});

export const App = () => {
  const [state, setState] = React.useState<UIState>(initialState);
  const [requestState, setRequestState] = useState<State>("idle");
  const [responseBody, setResponseBody] = useState<unknown | undefined>(
      undefined
  );
  const { imageId } = state;
  const disabled = !imageId || imageId.trim().length < 1;

  const getPlacement = async (
      placement?: ElementPlacement
  ): Promise<Placement | undefined> => {
    const pageContext = await getCurrentPageContext();
    const pageDimensions = pageContext.dimensions;
    if (!pageDimensions) {
      return;
    }

    const elementSize =
        Math.min(pageDimensions.height, pageDimensions.width) / 2;
    switch (placement) {
      case ElementPlacement.TOP_LEFT:
        return {
          top: 0,
          left: 0,
          width: elementSize,
          height: elementSize,
          rotation: 0,
        };
      case ElementPlacement.TOP_RIGHT:
        return {
          top: 0,
          left: pageDimensions.width - elementSize,
          width: elementSize,
          height: elementSize,
          rotation: 0,
        };
      case ElementPlacement.BOTTOM_LEFT:
        return {
          top: pageDimensions.height - elementSize,
          left: 0,
          width: elementSize,
          height: elementSize,
          rotation: 0,
        };
      case ElementPlacement.BOTTOM_RIGHT:
        return {
          top: pageDimensions.height - elementSize,
          left: pageDimensions.width - elementSize,
          width: elementSize,
          height: elementSize,
          rotation: 0,
        };
      default:
        return undefined;
    }
  };

  const items = Object.entries(images).map(([key, value]) => {
    const { title, imageSrc } = value;
    return {
      key,
      title,
      imageSrc,
      active: imageId === key,
      onClick: () => {
        setState((prevState) => {
          return {
            ...prevState,
            imageId: key,
          };
        });
      },
    };
  });

  const addOrUpdateAppImage = React.useCallback(async () => {
    if (!images[state.imageId].imageRef) {
      const { ref } = await upload({
        type: "IMAGE",
        mimeType: "image/jpeg",
        url: images[state.imageId].imageSrc,
        thumbnailUrl: images[state.imageId].imageSrc,
        width: 400,
        height: 400,
      });
      images[state.imageId].imageRef = ref;
    }
    const placement = await getPlacement(state.placement);
    await appElementClient.addOrUpdateElement(
        { imageId: state.imageId },
        placement
    );
  }, [state]);

  const addNativeImage = React.useCallback(async () => {
    if (!images[state.imageId].imageRef) {
      const { ref } = await upload({
        type: "IMAGE",
        mimeType: "image/jpeg",
        url: images[state.imageId].imageSrc,
        thumbnailUrl: images[state.imageId].imageSrc,
        width: 400,
        height: 400,
      });
      images[state.imageId].imageRef = ref;
    }
    const placement = await getPlacement(state.placement);
    await addNativeElement({
      type: "IMAGE",
      ref: images[state.imageId].imageRef,
      ...placement,
    });
  }, [state]);

  React.useEffect(() => {
    appElementClient.registerOnElementChange((appElement) => {
      setState((prevState) => {
        return appElement
            ? {
              ...prevState,
              ...appElement.data,
              isEditingAppElement: Boolean(appElement.data),
            }
            : { ...prevState, isEditingAppElement: false };
      });
    });
  }, []);

  const [{ fontStyle, fontWeight, decoration, textAlign }, setStateText] =
      React.useState<Required<DraggableTextProperties>>({
        decoration: "none",
        fontStyle: "normal",
        fontWeight: "normal",
        textAlign: "start",
      });

  const onDragStartForText = (event: React.DragEvent<HTMLElement>) => {
    ui.startDrag(event, {
      type: "TEXT",
      textAlign,
      decoration,
      fontStyle,
      fontWeight,
      children: [content],
    });
  };

  const onDragStartForLocalImage = (
      event: React.DragEvent<HTMLElement>,
      imageSrc
  ) => {
    ui.startDrag(event, {
      type: "IMAGE",
      resolveImageRef: () => uploadLocalImage(imageSrc),
      previewUrl: imageSrc,
      previewSize: {
        width: 100,
        height: 100,
      },
      fullSize: {
        width: 100,
        height: 100,
      },
    });
  };

  const onDragStartForExternalImage = (
      event: React.DragEvent<HTMLElement>
  ) => {
    ui.startDrag(event, {
      type: "IMAGE",
      resolveImageRef: uploadExternalImage,
      previewUrl:
          "https://www.canva.dev/example-assets/image-import/grass-image-thumbnail.jpg",
      previewSize: {
        width: 320,
        height: 212,
      },
      fullSize: {
        width: 320,
        height: 212,
      },
    });
  };

  const selection = useSelection("plaintext");

  const updateText = async () => {
    const draft = await selection.read();
    draft.contents.forEach((s) => (s.text = `${s.text}!`));
    await draft.save();
  };

  const sendGetRequest = async () => {
    try {
      setRequestState("loading");
      const token = await auth.getCanvaUserToken();
      const res = await fetch(BACKEND_URL, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const body = await res.json();
      setResponseBody(body);
      setRequestState("success");
    } catch (error) {
      setRequestState("error");
      console.error(error);
    }
  };

  return (
      <div className={styles.scrollContainer}>
        <Rows spacing="4u">
          <Text>
            Select your Eventlah posters, and use drag and drop to change text
            and images, update selected text, and position elements.
          </Text>
          <Rows spacing="3u">
            <Title size="small">Predefined Templates</Title>
            <Text size="small" tone="tertiary">
              These templates are provided by Eventlah for your usage.
            </Text>
            <Grid columns={3} spacing="1.5u">
              {items.map((item) => (
                  <ImageCard
                      key={item.key}
                      ariaLabel={`Add ${item.title.toLowerCase()} to design`}
                      alt={`${item.title.toLowerCase()} image`}
                      thumbnailUrl={item.imageSrc}
                      onDragStart={(event) =>
                          onDragStartForLocalImage(event, item.imageSrc)
                      }
                      onClick={() => insertLocalImage(item.imageSrc)}
                  />
              ))}
            </Grid>
          </Rows>
          <TypographyCard
              ariaLabel="Add text to design"
              onClick={() =>
                  addNativeElement({
                    type: "TEXT",
                    textAlign,
                    decoration,
                    fontStyle,
                    fontWeight,
                    children: [content],
                  })
              }
              onDragStart={onDragStartForText}
          >
            <Text
                variant={
                  ["semibold", "bold", "heavy"].includes(fontWeight)
                      ? "bold"
                      : "regular"
                }
            >
              {content}
            </Text>
          </TypographyCard>
          {/*<Rows spacing="3u">*/}
          {/*  <Title size="small">External Image</Title>*/}
          {/*  <Text size="small" tone="tertiary">*/}
          {/*    This image is an external https image made draggable via drag and*/}
          {/*    drop and asset upload.*/}
          {/*  </Text>*/}
          {/*  <ImageCard*/}
          {/*      ariaLabel="Add image to design"*/}
          {/*      alt="grass image"*/}
          {/*      thumbnailUrl="https://www.canva.dev/example-assets/image-import/grass-image.jpg"*/}
          {/*      onClick={insertExternalImage}*/}
          {/*      onDragStart={onDragStartForExternalImage}*/}
          {/*  />*/}
          {/*</Rows>*/}
          {/*<Rows spacing="2u">*/}
          {/*  <Text>*/}
          {/*    This example demonstrates how apps can replace the selected text.*/}
          {/*    Select a text in the editor to begin.*/}
          {/*  </Text>*/}
          {/*  <Button*/}
          {/*      variant="primary"*/}
          {/*      onClick={updateText}*/}
          {/*      disabled={selection.count === 0}*/}
          {/*  >*/}
          {/*    Append '!'*/}
          {/*  </Button>*/}
          {/*</Rows>*/}
          <Rows spacing="3u">
            <Text>
              This example demonstrates how apps can securely communicate with
              their servers via the browser's Fetch API.
            </Text>
            {requestState !== "error" && (
                <>
                  <Button
                      variant="primary"
                      onClick={sendGetRequest}
                      loading={requestState === "loading"}
                      stretch
                  >
                    Request data from Eventlah.com
                  </Button>
                  {requestState === "success" && responseBody && (
                      <FormField
                          label="Response"
                          value={JSON.stringify(responseBody, null, 2)}
                          control={(props) => (
                              <MultilineInput {...props} maxRows={5} autoGrow readOnly />
                          )}
                      />
                  )}
                </>
            )}

            {requestState === "error" && (
                <Rows spacing="3u">
                  <Rows spacing="1u">
                    <Title size="small">Something went wrong</Title>
                    <Text>To see the error, check the JavaScript Console.</Text>
                  </Rows>
                  <Button
                      variant="secondary"
                      onClick={() => {
                        setRequestState("idle");
                      }}
                      stretch
                  >
                    Reset
                  </Button>
                </Rows>
            )}
          </Rows>
          {/*<FormField*/}
          {/*    label="Select an image"*/}
          {/*    control={(props) => (*/}
          {/*        <Box id={props.id} padding="1u">*/}
          {/*          <Grid columns={3} spacing="1.5u">*/}
          {/*            {items.map((item) => (*/}
          {/*                <ImageCard*/}
          {/*                    ariaLabel={item.title}*/}
          {/*                    key={item.key}*/}
          {/*                    thumbnailUrl={item.imageSrc}*/}
          {/*                    onClick={item.onClick}*/}
          {/*                    selectable={true}*/}
          {/*                    selected={item.active}*/}
          {/*                    borderRadius="standard"*/}
          {/*                />*/}
          {/*            ))}*/}
          {/*          </Grid>*/}
          {/*        </Box>*/}
          {/*    )}*/}
          {/*/>*/}
        {/*  <FormField*/}
        {/*      label="Placement"*/}
        {/*      value={state.placement}*/}
        {/*      control={(props) => (*/}
        {/*          <Select*/}
        {/*              {...props}*/}
        {/*              options={[*/}
        {/*                { value: ElementPlacement.DEFAULT, label: "Default" },*/}
        {/*                { value: ElementPlacement.TOP_LEFT, label: "Top Left" },*/}
        {/*                { value: ElementPlacement.TOP_RIGHT, label: "Top Right" },*/}
        {/*                { value: ElementPlacement.BOTTOM_LEFT, label: "Bottom Left" },*/}
        {/*                { value: ElementPlacement.BOTTOM_RIGHT, label: "Bottom Right" },*/}
        {/*              ]}*/}
        {/*              onChange={(event) => {*/}
        {/*                setState((prevState) => {*/}
        {/*                  return {*/}
        {/*                    ...prevState,*/}
        {/*                    placement: event,*/}
        {/*                  };*/}
        {/*                });*/}
        {/*              }}*/}
        {/*              stretch*/}
        {/*          />*/}
        {/*      )}*/}
        {/*  />*/}
        {/*  <Button*/}
        {/*      variant="secondary"*/}
        {/*      onClick={addOrUpdateAppImage}*/}
        {/*      disabled={disabled}*/}
        {/*  >*/}
        {/*    {state.isEditingAppElement ? "Update app element" : "Add app element"}*/}
        {/*  </Button>*/}
        {/*  <Button*/}
        {/*      variant="secondary"*/}
        {/*      onClick={addNativeImage}*/}
        {/*      disabled={disabled}*/}
        {/*  >*/}
        {/*    Add native element*/}
        {/*  </Button>*/}
        {/*</Rows>*/}
        </Rows>
      </div>
  );
};