package com.ptit.iot.dto;

public class ProfileDTO {
    private Integer id;
    private String username;
    private String name;
    private String image;
    private String github;
    private String figma;
    private String msv;
    private String postman;
    private String pdf;

    public ProfileDTO() {
    }

    public ProfileDTO(Integer id, String username, String name, String image, String github, String figma, String msv, String postman, String pdf) {
        this.id = id;
        this.username = username;
        this.name = name;
        this.image = image;
        this.github = github;
        this.figma = figma;
        this.msv = msv;
        this.postman = postman;
        this.pdf = pdf;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getGithub() {
        return github;
    }

    public void setGithub(String github) {
        this.github = github;
    }

    public String getFigma() {
        return figma;
    }

    public void setFigma(String figma) {
        this.figma = figma;
    }

    public String getMsv() {
        return msv;
    }

    public void setMsv(String msv) {
        this.msv = msv;
    }

    public String getPostman() {
        return postman;
    }

    public void setPostman(String postman) {
        this.postman = postman;
    }

    public String getPdf() {
        return pdf;
    }

    public void setPdf(String pdf) {
        this.pdf = pdf;
    }
}

